import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReplaySubject, SubscriptionLike as ISubscription, throwError as _throw, Observable, of, throwError, from } from 'rxjs';

import { config, Config } from './config';

import { Product } from './product.service';
import { Utils } from './util';

import { Order, OrderItem } from './order/order';
import { Shop } from './shop.service';
import { User, UserAddress, UserCard, DepositAddress } from './user.service';
import { map, catchError, switchMap, debounceTime } from 'rxjs/operators';
import { ConfigService } from './config.service';
import './es5';

//
// on recurrent order
export enum CartItemFrequency {
  ITEM_ONCE = 0,
  ITEM_WEEK = 1,
  ITEM_2WEEKS = 2,
  ITEM_MONTH = 3,
  ITEM_QUARTER = 4
}
//
// on cart action
export enum CartAction {
  ITEM_ADD = 1,
  ITEM_REMOVE = 2,
  ITEM_MAX = 3,
  ITEM_ALL = 12,
  CART_INIT = 4,
  CART_LOADED = 5,
  CART_LOAD_ERROR = 6,
  CART_SAVE_ERROR = 7,
  CART_ADDRESS = 8,
  CART_PAYMENT = 9,
  CART_SHPPING = 10,
  CART_CLEARED = 11
}

//
// on cart change
export class CartState {
  item?: CartItem;
  action: CartAction;
  //sync: boolean;
}

//
// cart content
export class CartItem {

  constructor(item: any | CartItem) {
    // avoid UI artefact on loading 
    item['selected'] = undefined;
    Object.assign(this, item);
  }
  deleted?: boolean;
  frequency?: CartItemFrequency;
  timestamp: Date;
  displayName?: string;
  email?: string;
  hub: string;
  title: string;
  sku: number;
  variant: string;
  thumb: string;
  price: number;
  finalprice: number;
  weight: number;
  error?: string;
  note: string;
  category: {
    slug: string;
    name: string;
  };
  vendor: {
    urlpath: string;
    name: string;
    weekdays: number[];
    photo: string;
    discount: {
      threshold?: number;
      amount?: number;
    }
  }
  discount: boolean;
  part: string;
  quantity: number;

  static fromOrder(orderItem: OrderItem, vendor: Shop) {
    const variant = (orderItem.variant) ? orderItem.variant.title : null;
    const item = {
      timestamp: (new Date()),
      title: orderItem.title,
      sku: orderItem.sku,
      variant: (variant),
      thumb: orderItem.thumb,
      price: orderItem.price,
      finalprice: orderItem.price,
      category: {
        slug: orderItem.category,
        name: orderItem.category
      },
      vendor: {
        urlpath: vendor.urlpath,
        name: vendor.name,
        weekdays: vendor.available.weekdays,
        photo: vendor.photo.owner,
        discount: { threshold: null, amount: 0 }
      },
      part: orderItem.part,
      quantity: orderItem.quantity
    };
    //
    // init discount
    // TODO howto manage discount link
    if (vendor.discount &&
        vendor.discount.active) {
      item.vendor.discount.threshold = (vendor.discount.threshold);
      item.vendor.discount.amount = (vendor.discount.amount);
    }
    return new CartItem(item);
  }
  static fromProduct(product: Product, variant?: string, quantity?: number) {
    const item = {
      timestamp: (new Date()),
      title: product.title,
      sku: product.sku,
      variant: (variant),
      thumb: product.photo.url,
      price: product.getPrice(),
      finalprice: product.getPrice(),
      category: {
        slug: product.categories.slug,
        name: product.categories.name
      },
      vendor: {
        urlpath: product.vendor.urlpath,
        name: product.vendor.name,
        weekdays: product.vendor.available.weekdays,
        photo: product.vendor.photo.owner,
        /* FIXME vendor discount should be managed */
        discount: { threshold: null, amount: 0 }
      },
      weight: product.categories.weight,
      discount: product.isDiscount(),
      part: product.pricing.part,
      quantity: (quantity || 1)
    };
    //
    // init discount 
    // TODO howto manage discount link
    if (product.vendor.discount &&
        product.vendor.discount.active) {
      item.vendor.discount.threshold = parseFloat(product.vendor.discount.threshold);
      item.vendor.discount.amount = parseFloat(product.vendor.discount.amount);
    }
    return new CartItem(item);
  }

  equalItem(other: CartItem, variant?: string) {
    const bSku = this.sku == other.sku;
    if (!variant) {
      return bSku;
    }
    return (this.variant &&
      this.variant == variant &&
      bSku);
  }

  //
  // FIXME server need this format, that should be modified
  toDEPRECATED() {
    return {
      sku: this.sku,
      title: this.title,
      variant: this.variant,
      categories: this.category.name,
      vendor: this.vendor.urlpath,
      quantity: this.quantity,
      price: this.price,
      part: this.part,
      note: this.note,
      finalprice: this.finalprice
    };

  }
}

//
// cart
export class CartConfig {
  namespace: string;
  gateway: {
    fees: number,
    label: string
  };
  currency: string;
  shipping: any | {
    average: number;
    price: {
      hypercenter: number;
      periphery: number;
      others: number;
    }
    //
    // discount amount
    priceA: number;
    priceB: number;
    //
    // discount threshold
    discountA: number;    // half price 5.4@18% & 4.5@15%
    discountB: number;    // 180 full price 11.7@18% & 9.75@15%

    //
    // postalCodes
    periphery: string[];
    others: string[];
  };

  constructor() {
    const defaultShipping = {
      // average
      average: 0,
      price: {},
      priceA: 0,
      priceB: 0,
      discountA: 0,    // half price 5.4@18% & 4.5@15%
      discountB: 0,    // 180 full price 11.7@18% & 9.75@15%
      periphery: [],
      others: [],
      collect: []
    };
    this.namespace = 'kng2-cart';
    this.currency = 'CHF';
    this.shipping = {};
    this.gateway = { fees: 0, label: 'Aucun' };
    Object.assign(this.shipping, defaultShipping);
  }

}

export class CartModel {
  cid: string | [string];
  items: CartItem[];
  updated: Date;
  reset: Date;
  constructor() {
    this.items = [];
  }
}

//
// Cart Cache content
// which is used over time (close/open navigator)
// this should be serialized in server side
class Cache extends CartModel {

  //
  // vendors discounts
  // TODO vendors discount should feet actual vendors settings
  discount: any;
  address: DepositAddress | UserAddress;
  payment: UserCard;
  currentShippingDay: Date;
  currentShippingTime: number;
  uuid?: string;
  name?: string;
  loaded: boolean;
  timestamp: number;
  constructor() {
    super();
    this.discount = {};
    this.address = new DepositAddress();
    this.payment = new UserCard();
    // FIXME use rxjs to debounce call
    this.timestamp = Date.now();
    // shipping dated depends on config...
    // see setContext(...)
    // this.currentShippingDay=Order.nextShippingDay();
    // this.currentShippingTime=16;
  }
}


@Injectable()
export class CartService {

  private isReady: boolean;
  private headers: HttpHeaders;

  private currentHub: string;
  private currentUser: User;
  private currentShops: Shop[] = [];
  private currentPendingOrder: Order;

  private defaultConfig: Config = config;

  //
  // initial cart configuration
  private cartConfig: CartConfig = new CartConfig();

  private cache = new Cache();

  private load$: ReplaySubject<string>;


  public SHIPPING_COLLECT = 'collect';
  public SHIPPING_CENTER = 'hypercenter';
  public SHIPPING_PERIPHERY = 'periphery';
  public SHIPPING_OTHER = 'other';

  public DEFAULT_GATEWAY: any;
  public cart$: ReplaySubject<CartState>;

  constructor(
    private $http: HttpClient
  ) {
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.headers.append('Cache-Control', 'no-cache');
    this.headers.append('Pragma' , 'no-cache');
    this.cache = new Cache();
    this.currentUser = new User();
    this.DEFAULT_GATEWAY = this.cartConfig.gateway;
    //
    // 1 means to keep the last value
    this.cart$ = new ReplaySubject(1);
    this.load$ = new ReplaySubject(1);
    this.isReady = false;

    this.load$.asObservable().pipe(debounceTime(200)).subscribe((cached)=> {
      this.internalLoad(cached);
    })
    
    // this.cart$.next({action:CartAction.CART_INIT});
  }


  //
  // API
  //


  //
  // add multiples items
  addAll(products: Product[] | CartItem[]) {
    if(!products || !products.length) {
      return;
    }
    products.forEach(item => this.add(item, item.variant, true));
    this.save({ action: CartAction.ITEM_ALL });
  }

  //
  // add one item
  add(product: Product | CartItem, variant?: string, quiet?: boolean) {
    // if(window.fbq)fbq('track', 'AddToCart');
    this.checkIfReady();
    const items = this.cache.items;
    const item = (product instanceof CartItem) ? product : CartItem.fromProduct(product, variant);

    //
    // update HUB
    item.hub = this.currentHub;

    // console.log('--- ADD ITEM',item.sku,item.hub);

    for (let i = 0; i < items.length; i++) {
      if (items[i].equalItem(item, variant)) {

        //
        // check availability
        // TODO products should be cached in Cart.cache.products[] to sync vendor/discount and quantity
        if ((product instanceof Product) &&
          product.pricing &&
          product.pricing.stock <= items[i].quantity) {
          // return api.info($rootScope,"La commande maximum pour ce produit à été atteintes.",4000);
          if (quiet) {
            return;
          }
          this.cart$.next({ item: items[i], action: CartAction.ITEM_MAX });
          return;
        }

        //
        //  fast cart load
        if (items[i].quantity > 10) {
          items[i].quantity += 5;
        } else if (items[i].quantity > 4) {
          items[i].quantity += 2;
        } else {
          items[i].quantity++;
        }
        //
        // update the finalprice and vendor
        items[i].finalprice = items[i].price * items[i].quantity;
        items[i].vendor = item.vendor;

        // TODO warn update
        this.computeVendorDiscount(product.vendor);

        if (quiet) {
          return;
        }
        this.save({ item: items[i], action: CartAction.ITEM_ADD });
        return;
      }
    }


    items.push(item);
    // TODO warn update
    this.computeVendorDiscount(product.vendor);

    if (quiet) {
      return;
    }

    return this.save({ item, action: CartAction.ITEM_ADD });
  }

  // clear error
  clearErrors() {
    const items = this.cache.items;
    for (let i = 0; i < items.length; i++) {
      items[i].error = undefined;
    }
  }

  //
  // cart initialisation valid
  checkIfReady() {
    if (!this.isReady) { throw new Error('Cart is used before initialisation'); }
  }

  //
  // compute discount by vendor
  computeVendorDiscount(vendor: Shop) {
    // init
    const items = this.cache.items;
    let amount = 0;

    //
    // no discount
    if (!vendor.discount || !vendor.discount.active) {
      this.cache.discount[vendor.urlpath] = 0;
      return 0;
    }

    //
    // subtotal for the vendor
    items.forEach((item) => {
      if (item.vendor.urlpath === vendor.urlpath) {
        amount += (item.price * item.quantity);
      }
    });

    //
    // compute discount based on vendor
    const discountMagnitude = Math.floor(amount / vendor.discount.threshold);
    this.cache.discount[vendor.urlpath] = discountMagnitude * vendor.discount.amount;

    //
    // return the discount or 0
    return this.cache.discount[vendor.urlpath] || 0;
  }


  computeShippingFees(address: UserAddress|DepositAddress) {
    const total = this.subTotal()
    let price = this.estimateShippingFees(address);

    //
    // TODO TESTING MERCHANT ACCOUNT
    // if (user.merchant===true){
    // return Utils.roundAmount(price-this.cartConfig.shipping.priceB);
    // }

    //
    // find for deposit address
    if(address['fees'] >= 0) {
      return price = address['fees'];
    }



    //
    // implement 3) get free shipping!
    if (this.cartConfig.shipping.discountB &&
      total >= this.cartConfig.shipping.discountB) {
      price = Math.max(price - this.cartConfig.shipping.priceB,0);
    } else if (this.cartConfig.shipping.discountA &&
      total >= this.cartConfig.shipping.discountA) {
      price = Math.max(price - this.cartConfig.shipping.priceA,0);
    }

    return price;
  }

  estimateShippingFees(address: UserAddress) {
    this.checkIfReady();
    const total = this.subTotal();

    //
    // check if there is a pending order for this address
    if(this.hasShippingReductionMultipleOrder(address)) {
      return 0;
    }

    const postalCode = address.postalCode || '1234567';

    let district = config.getShippingDistrict(postalCode);


    //
    // get default price for this address
    let price = this.cartConfig.shipping.price[district];

    //
    // testing deposit address
    // FIXME issue with streetAdress vs. streetAddress
    const deposit = this.defaultConfig.shared.hub.deposits.find(add => {
      return add.isEqual(address) &&
        add.fees >= 0;
    });
    if (deposit) {
      price = deposit.fees;
      return price;
    }

    //
    // TODO TESTING MERCHANT ACCOUNT
    return price;
  }

  //
  // TODO empty should manage recurent items
  empty() {
    // THOSE should be available
    this.cache.payment = new UserCard();
    this.cache.address = new UserAddress();
    this.cartConfig.gateway = this.DEFAULT_GATEWAY;
    //
    // remove all items for this HUB
    this.cache.items = [];
    this.cache.discount = {};

    //console.log('---DEBUG cart:clear',this.cache);
    //
    // FIXME dont use localstorage here
    localStorage.setItem('kng2-cart', JSON.stringify(this.cache));
    this.save({ action: CartAction.CART_CLEARED });
    return new Observable((obs) => {
      this.cart$.subscribe(state => {
        obs.next(state);
        obs.complete();
      },obs.error);
    });
  }

  findBySku(sku: number): CartItem {
    // TODO shall we filter items by hub ? && item.hub === this.currentHub
    return this.getItems().find(item => item.sku === sku);
  }

  getCurrentGateway(): { fees: number, label: string } {
    this.checkIfReady();
    this.updateGatewayFees();
    return this.cartConfig.gateway;
  }

  //
  // compute amout of
  gatewayAmount() {
    this.checkIfReady();
    const total = this.subTotal(),
      shipping = this.shipping();
    return this.getCurrentGateway().fees * (total + shipping - this.totalDiscount());
  }

  getItems() {
    this.checkIfReady();
    return this.cache.items.filter(item => (!item.hub || item.hub === this.currentHub));
  }

  getName(){
    this.checkIfReady();
    return this.cache.name;
  }

  getCID(){
    this.checkIfReady();
    return this.cache.cid;
  }

  getCurrentShippingAddress(): UserAddress {
    this.checkIfReady();
    return this.cache.address;
  }

  getCurrentShippingFees() {
    this.checkIfReady();
    return this.shipping();
  }

  getCurrentShippingDay() {
    this.checkIfReady();
    return this.cache.currentShippingDay;
  }
  getCurrentShippingTime() {
    this.checkIfReady();
    return this.cache.currentShippingTime;
  }

  getCurrentPaymentMethod() {
    return this.cache.payment;
  }

  //
  // TODO should be refactored (distance between real shop settings and cart values)!!
  getVendorDiscount(slug: string) {
    this.checkIfReady();
    return Utils.roundAmount(this.cache.discount[slug]);
  }

  hasError(): boolean {
    return this.getItems().some(item => item.error);
  }

  hasPendingOrder(): boolean {
    return !!(this.currentPendingOrder && this.currentPendingOrder.shipping);
  }

  hasShippingReductionMultipleOrder(address?): boolean {
    //
    // check if there is a pending order for this address
    if(this.currentPendingOrder && this.currentPendingOrder.shipping){
      const whenDay = this.currentPendingOrder.shipping.when.getDate();
      const nextDay = this.cache.currentShippingDay.getDate();
      const pending = UserAddress.from(this.currentPendingOrder.shipping);
      address = address || this.cache.address;
      if(address.isEqual(pending) && whenDay == nextDay ){
        return true;
      }
    }
    return false;
  }

  hasShippingReduction(): boolean {
    const total = this.subTotal();

    //
    // FIXME shipping reduction for pending depends on dst address
    if(this.hasPendingOrder()) {
      return true;
    }

    // implement 3) get free shipping!
    if (this.cartConfig.shipping.discountB &&
      total >= this.cartConfig.shipping.discountB) {
      return true;
    } else
      if (this.cartConfig.shipping.discountA &&
        total >= this.cartConfig.shipping.discountA) {
        return true;
      }

    return false;
  }

  hasShippingReductionB(): boolean {
    const total = this.subTotal();

    // implement 3) get free shipping!
    if (this.cartConfig.shipping.discountB &&
      total >= this.cartConfig.shipping.discountB) {
      return true;
    }
    return false;
  }


  isCurrentShippingDayAvailable(shop: Shop): boolean {
    this.checkIfReady();
    const weekday = this.cache.currentShippingDay.getDay();
    return shop.available.weekdays.indexOf(weekday) > -1;
  }

  load(shared?:string) {
    this.load$.next(shared);
  }

  loadCache(shared?: string) {

    if(this.cache.loaded) {
      return;
    }
    //
    // IFF next shipping day is Null (eg. hollidays)=> currentShippingDay
    const nextShippingDay = Order.nextShippingDay(this.currentUser);
    const currentShippingDay = config.potentialShippingWeek()[0];
    this.cache.currentShippingDay = new Date(nextShippingDay || currentShippingDay);

    this.cache.updated = new Date('1990-12-01T00:00:00');
    this.cache.discount = {};
    this.cache.uuid = shared;

    try {
      const fromLocal = JSON.parse(localStorage.getItem('kng2-cart')) as Cache;

      // FIXME missing test for shared cart 
      if (!fromLocal || shared) {
        return;
      }


      //
      // check shipping date or get the next one
      // FIXME default shipping time is hardcoded
      this.cache.currentShippingTime = fromLocal.currentShippingTime || 16;
      this.cache.currentShippingDay = new Date(fromLocal.currentShippingDay || nextShippingDay || currentShippingDay);

      //
      // get state from pending order
      if(this.currentPendingOrder){
        this.cache.currentShippingDay = new Date(this.currentPendingOrder.shipping.when);
      }

      //
      // if selected shipping date is before the next one => reset the default date
      if (this.cache.currentShippingDay < nextShippingDay) {
        this.cache.currentShippingDay = nextShippingDay;
      }

      if (fromLocal.updated) {
        this.cache.updated = new Date(fromLocal.updated);
      }

      //
      // items will be completed on load()
      if (fromLocal.items) {
        this.cache.items = fromLocal.items as CartItem[];
      }

      //
      // load only available payment
      if (fromLocal.payment) {
        this.cache.payment = new UserCard(fromLocal.payment);
        // check validity
        if (!this.cache.payment.isValid()) {
          this.cache.payment = null;
        } else if (
          !this.currentUser.payments.some(payment => payment.isEqual(this.cache.payment))) {
          this.cache.payment = new UserCard();
        }
      }

      //
      // get state from pending order
      // FIXME set address equals to pending
      if(this.currentPendingOrder){
        this.cache.address = UserAddress.from(this.currentPendingOrder.shipping);          
      }else

      //
      // FIXME create function that return UserAddress DepositAddress
      // load address
      if (fromLocal.address) {
        this.cache.address = new UserAddress(
          fromLocal.address.name,
          fromLocal.address.streetAdress,
          fromLocal.address.floor,
          fromLocal.address.region,
          fromLocal.address.postalCode,
          fromLocal.address.note,
          fromLocal.address.primary,
          fromLocal.address.geo
        );

        if ((fromLocal.address['fees'] >= 0)) {
          this.cache.address = this.cache.address as DepositAddress;
          Object.assign(this.cache.address, fromLocal.address);
          this.cache.address.floor = '-';
        }
      }

      //
      // check existance on the current user (example when you switch account, cart should be sync )
      if (!this.currentUser.addresses.some(address => address.isEqual(this.cache.address)) &&
        !this.defaultConfig.shared.hub.deposits.some(address => address.isEqual(this.cache.address))) {
        this.cache.address = new UserAddress();
      }

      //console.log('---DEBUG cart:load',this.cache.address);
      this.cache.loaded = true;
    } catch(err) {
      // First time in karibou.ch localStorage is undefined
      this.cache.items = []
      this.cache.updated = new Date('1990-12-01T00:00:00');
      this.cache.loaded = true;
    }
  }

  internalLoad(shared?: string) {
    this.cache.timestamp = Date.now();
    //
    // INIT local values
    this.loadCache(shared);
    //
    // INIT cart items
    // check values
    const syncCart: any = {
        items: this.cache.items || [],
        updated: this.cache.updated 
    };

    //
    // FIXME assert currentHub existance
    const params = {
      cart: syncCart,
      hub: this.currentHub
    };

    //
    // use a shared cart ? 
    const query: any = {};
    if(shared) {
      query.uuid = shared;
    }


    this.$http.post<CartModel>(ConfigService.defaultConfig.API_SERVER + '/v1/cart/get', params, {
      params: query,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(cart => {
        return cart;
      }),
      catchError(() => {
        return of(syncCart);
      })
    ).subscribe(cart => {
      if (cart) {
        //
        // reset local cart ?
        this.resetLocalItems(cart);
        this.cache.cid = cart.cid? cart.cid[0] : this.cache.cid ;
        this.cache.name = cart.name ;
        this.cache.updated = new Date(cart.updated);
        this.cache.items = cart.items.map( item => new CartItem(item));
        this.clearErrors();

        //
        // compute temporary discount on load
        const vendors: {[key: string]: Shop } = {};
        this.cache.items.forEach(item => vendors[item.vendor.urlpath] = (item.vendor as any as Shop));

        //
        // vendors
        Object.keys(vendors).forEach(slug => {
          const vendor = vendors[slug];
          const elem = this.currentShops.find(v => v.urlpath === vendor.urlpath);
          if(!vendor.discount) {
            vendor.discount = {
              active : true,
              threshold : 0,
              amount : 0
            };
          }
          vendor.discount.active = true;
          this.computeVendorDiscount(elem || vendor);
        });
        Object.assign(this.cache.discount, cart.discount);
      }
      this.cart$.next({ action: CartAction.CART_LOADED });
    });

    //
    // TODO
    // this.cart$.next({ action: CartAction.CART_LOAD_ERROR });
  }

  resetLocalItems(cart: any) {
    if (cart.reset) {
      const updated = new Date(cart.updated);
      const reset = new Date(cart.reset);
      const count = this.cache.items.length;
      this.cache.items = this.cache.items.filter(item => !item.timestamp || (new Date(item.timestamp)) > reset)
      if (this.cache.items.length !== count) {
        this.cache.updated = reset;
        try {
          //
          // FIXME how to manage cart & HUB 
          localStorage.setItem('kng2-cart', JSON.stringify(this.cache));
        } catch (e) {}
      }
    }
  }

  removeAll(product: Product | CartItem, variant?: string) {
    this.checkIfReady();
    // init
    const items = this.getItems();
    const item = (product instanceof CartItem) ? product : CartItem.fromProduct(product);
    //
    // update HUB
    item.hub = this.currentHub;

    //
    for (let i = 0; i < items.length; i++) {
      if (items[i].equalItem(item, variant)) {
        //
        // sure to send remove quantity to the server
        item.quantity = items[i].quantity;
        const indexInCache = this.cache.items.findIndex(itm => itm.sku === items[i].sku && itm.hub === this.currentHub);
        this.cache.items.splice(indexInCache, 1);
        break;
      }
    }
    //
    // update discount amount
    this.computeVendorDiscount(product.vendor);
    return this.save({ item, action: CartAction.ITEM_REMOVE });
  }

  remove(product: Product | CartItem, variant?: string) {
    this.checkIfReady();
    // init
    const items = this.getItems();
    const item = (product instanceof CartItem) ? Object.assign({}, product) : CartItem.fromProduct(product, variant);    
    // propagate server : remove one
    item.quantity = 1;

    //
    // update HUB
    item.hub = this.currentHub;

    //
    for (let i = 0; i < items.length; i++) {
      if (items[i].equalItem(item, variant)) {
        // if(items[i].sku===product.sku){
        items[i].quantity -= 1;

        //
        // update the finalprice
        items[i].finalprice = items[i].price * items[i].quantity;

        if (items[i].quantity <= 0) {
          const indexInCache = this.cache.items.findIndex(itm => itm.sku === items[i].sku && itm.hub === this.currentHub);
          this.cache.items.splice(indexInCache, 1);
        }
        break;
      }
    }
    //
    // update discount amount
    this.computeVendorDiscount(product.vendor);
    return this.save({ item, action: CartAction.ITEM_REMOVE });
  }

  //
  // save with localStorage
  // save with api/user/cart
  save(state: CartState) {
    this.saveServer(state)
    .pipe(
      catchError(e => {
        return of(state);
      }),
      switchMap(state => {
        return this.saveLocal(state);
      })
    )
    .subscribe(state => {
      this.cart$.next(state);
    }, error => {
      this.cart$.next({ action: CartAction.CART_SAVE_ERROR});
    });
  }

  private saveLocal(state: CartState): Observable<CartState> {
    return new Observable((observer) => {
      try {
        //
        // update local date IFF not authenticated or invalid
        if(!this.cache.updated ||
           !this.cache.updated.getTime() ||
           !this.currentUser.isAuthenticated()) {
            this.cache.updated = new Date();
        }
        //console.log('---DEBUG kng2-cart:saveLocal',this.cache.address);
        localStorage.setItem('kng2-cart', JSON.stringify(this.cache));
        observer.next(state);
      } catch (e) {
        observer.error(e);
      }
      observer.complete();
    });
  }

  private saveServer(state: CartState): Observable<CartState> {
    const model: CartModel = new CartModel();
    const params: any = {};
    model.cid = this.cache.cid;
    model.items = this.getItems();
    const errors = model.items.filter(item => item.error);

    if (!this.currentUser.isAuthenticated()) {
      // console.log('--- DBG cart.save unauthorized');
      return throwError('Unauthorized');
    }

    //
    // FIXME quick fix for debounceTime of ~500ms
    if(this.cache.timestamp) {
      const time = Date.now() - this.cache.timestamp;
      if(time < 500){
        // console.log('--- DBG cart.save time',time<500);
        return throwError('debounce');
      }
      this.cache.timestamp = Date.now();
    }

    if ([CartAction.ITEM_ADD, CartAction.ITEM_REMOVE, CartAction.ITEM_ALL, CartAction.CART_CLEARED].indexOf(state.action) === -1) {
      return of(state);
    }
    //
    // case of add/remove item
    if (state.item && [CartAction.ITEM_ADD, CartAction.ITEM_REMOVE].indexOf(state.action) > -1) {
      model.items = [state.item];
      params.action = CartAction[state.action];
    }

    //
    // FIXME assert currentHub existance
    params.hub = this.currentHub;
    params.device = Utils.deviceID();

    //
    // use a shared cart ? 
    if(this.cache.uuid) {
      params.uuid = this.cache.uuid;
    }

    return this.$http.post<CartModel>(ConfigService.defaultConfig.API_SERVER + '/v1/cart', model, {
      params: (params),
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(model => {
      this.cache.cid = model.cid;
      this.cache.items = model.items.map(item => new CartItem(item));
      this.cache.updated = new Date(model.updated);

      //
      // restore errors
      const hubItems = this.getItems();
      //hubItems.filter(item => errors.some(elem => elem[item.sku]))
      errors.forEach(item => {
        const restored = (hubItems.find(i => i.sku === item.sku));
        restored && (restored.error = item.error);
      });
      //console.log('---DEBUG kng2-cart:saveServer',this.cache.address);

      //
      // sync with server is done!
      return state;
    }),
    catchError(e => {
      return this.saveLocal(state);
    }));
  }


  //
  // set default user address
  setShippingAddress(address: UserAddress|DepositAddress) {
    //
    // check if deposit
    const deposit = this.defaultConfig.shared.hub.deposits.find(add => {
      return add.isEqual(address) && add.fees >= 0;
    });
    
    
    //
    // check if address exist before to save it
    if (!deposit && !this.currentUser.addresses.some(address => address.isEqual(address))){
      return;
    }

    this.cache.address = address;
    this.save({ action: CartAction.CART_ADDRESS });
  }

  //
  // set default user payment
  setPaymentMethod(payment: UserCard) {
    this.cache.payment = payment;
    this.updateGatewayFees();
    this.save({ action: CartAction.CART_PAYMENT });
  }

  setShippingDay(newDate: Date, hours?: number) {
    if (newDate.equalsDate(this.cache.currentShippingDay)) {
      return;
    }
    this.cache.currentShippingDay = newDate;
    this.cache.currentShippingTime = hours || 16;
    this.save({ action: CartAction.CART_SHPPING });
  }

  //
  // init cart context => load & merge available cart, with current one
  // - user latest orders (helper for complement)
  setContext(config: Config, user: User, shops?: Shop[], orders?:Order[]) {
    Object.assign(this.defaultConfig, config);
    Object.assign(this.currentUser, user);
    this.currentHub = this.defaultConfig.shared.hub.slug;
    this.currentShops = shops || this.currentShops || [];

    this.cartConfig.shipping = this.defaultConfig.shared.shipping;

    //
    // set default shipping address
    this.cache.address = user.getDefaultAddress();
    this.cache.currentShippingDay = Order.nextShippingDay(user);
    // FIXME default shipping time should not be hardcoded
    this.cache.currentShippingTime = 16;

    //
    // if there is an open order, 
    // - set the default address
    // - set the default date
    orders = orders || [];
    //
    // EnumFinancialStatus[EnumFinancialStatus.authorized]
    const opens = orders.filter(order => order.payment.status == 'authorized' && !order.shipping.parent); 
    if(opens.length) {
      this.currentPendingOrder = opens[0];
    }

    //
    // mark cart ready
    this.isReady = true;
    this.load();
  }

  setError(errors) {
    let sku, item;
    for (let i = 0; i < errors.length; i++) {
      sku = Object.keys(errors[i])[0];
      item = this.findBySku(+sku);
      if (item) { item.error = errors[i][sku]; }
    }
  }


  shipping(removeDiscount?: boolean) {
    // check if cart is available

    const total = this.subTotal();
    let price = this.computeShippingFees(this.cache.address);

    // Compute shipping and substract discount
    if (removeDiscount) {
      const fees = this.getCurrentGateway().fees * (total + price);
      price -= (this.totalDiscount() - fees);
    }

    return Utils.roundAmount(Math.max(price, 0));
  }


  subTotal(): number {
    const items = this.getItems();
    let total = 0;
    items.forEach((item) => {
      total += (item.price * item.quantity);
    });
    const fees = (config.shared.hub.serviceFees) * total;
    return Utils.roundAmount(total + fees);
  }


  /**
   * Subscribe to the user stream.
   */
  subscribe(
    onNext, onThrow?: ((exception: any) => void) | null,
    onReturn?: (() => void) | null): ISubscription {
    return this.cart$.subscribe({ next: onNext, error: onThrow, complete: onReturn });
  }


  quantity(): number {
    const items = this.getItems();
    let quantity = 0;
    items.forEach((item) => {
      quantity += item.quantity;
    });
    return quantity;
  }


  //
  // total = items + shipping - total discount
  // total = stotal + stotal*payment.fees
  // WARNNG -- WARNNG -- WARNNG -- edit in all places
  total(): number {
    let total = this.subTotal();
    const shipping = this.shipping();
    const discount = this.totalDiscount();
    total += (shipping - discount);

    // Rounding up to the nearest 0.05
    return Utils.roundAmount(total);

  }

  //
  // FIXME, that should be based on the list of all vendors Shop[] (item.vendor.discount could change )
  // NOTE, discount is based on items that bellongs to the current HUB
  totalDiscount(): number {
    let amount = 0;
    for (const slug in this.cache.discount) {
      amount += (this.cache.discount[slug] || 0);
    }

    return Utils.roundAmount(amount);
  }

  totalFees(): number {
    const items = this.getItems();
    let total = 0;
    items.forEach((item) => {
      total += (item.price * item.quantity);
    });

    const fees = (config.shared.hub.serviceFees) * total;
    return Utils.roundAmount(fees);
  }

  //
  // set cart tax and return payment label
  updateGatewayFees(): boolean {
    if (!this.cache.payment) {
      return false;
    }
    if (this.cache.payment.issuer == this.cartConfig.gateway.label) {
      return true;
    }
    //
    // init default one
    this.cartConfig.gateway = this.DEFAULT_GATEWAY;
    return this.defaultConfig.shared.order.gateway.some(gateway => {
      // TODO check issuer vs type
      if (gateway.label === this.cache.payment.issuer) {
        this.cartConfig.gateway = gateway;
        return true;
      }
      return false;
    });
  }



  //
  // REST api wrapper
  //

  private handleError(error: Response | any) {
    //
    // In a real world app, you might use a remote logging infrastructure
    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    return _throw(errMsg);
  }
}

