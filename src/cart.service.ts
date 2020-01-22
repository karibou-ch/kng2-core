import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { config, Config } from './config';

import { Product } from './product.service';
import { Utils } from './util';

import { OrderService } from './order/order.service';
import { Order, OrderItem } from './order/order';
import { Shop } from './shop.service';
import { User, UserAddress, UserCard, DepositAddress } from './user.service';
import { ISubscription } from 'rxjs/Subscription';

import { _throw } from 'rxjs/observable/throw';
import { ConfigService } from './config.service';
import { map, catchError } from 'rxjs/operators';
// import { catchError, map, tap } from 'rxjs/operators';

//
// on recurrent order
export enum CartItemFrequency {
  ITEM_ONCE      = 0,
  ITEM_WEEK      = 1,
  ITEM_2WEEKS    = 2,
  ITEM_MONTH     = 3,
  ITEM_QUARTER   = 4
}

//
// on cart action
export  enum CartAction {
  ITEM_ADD       = 1,
  ITEM_REMOVE    = 2,
  ITEM_MAX       = 3,
  CART_INIT      = 4,
  CART_LOADED    = 5,
  CART_LOAD_ERROR= 6,
  CART_SAVE_ERROR= 7,
  CART_ADDRESS   = 8,
  CART_PAYMENT   = 9,
  CART_SHPPING   = 10,
  CART_CLEARED   = 11
}

//
// on cart change
export class CartState {
  public item?: CartItem;
  public action: CartAction;
}

//
// cart content
export class CartItem {
  public deleted?: boolean;
  public frequency?: CartItemFrequency;
  public timestamp: Date;
  public displayName?: string;
  public email?: string;
  public title: string;
  public sku: number;
  public variant: string;
  public thumb: string;
  public price: number;
  public finalprice: number;
  public weight: number;
  public error?: string;
  public note: string;
  public category: {
    slug: string;
    name: string;
  };
  public vendor: {
    urlpath: string;
    name: string;
    weekdays: number[];
    photo: string;
    discount: {
      threshold?: number;
      amount?: number;
    }
  };
  public discount: boolean;
  public part: string;
  public quantity: number;

  constructor(item: any|CartItem) {
    // avoid UI artefact on loading
    item['selected'] = undefined;
    Object.assign(this, item);
  }

  public equalItem(other: CartItem, variant?: string) {
    const bSku = this.sku === other.sku;
    if (!variant) {
      return bSku;
    }
    return (this.variant &&
      this.variant === variant &&
      bSku);
  }

  //
  // FIXME server need this format, that should be modified
  public toDEPRECATED() {
    return{
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

  public static fromOrder(orderItem: OrderItem) {

      // TODO missing props CartItem.fromOrderItem
      //  - thumb:orderItem.thumb,
      //  - category.slug: orderItem.category,
      //  - name: product.vendor.name,
      //  - weekdays: product.vendor.available.weekdays,
      //  - photo: product.vendor.photo.owner,
      //  - discount:
      //  - weight:product.categories.weight,
      //  - discount:product.isDiscount(),

    const item = {
      timestamp: (new Date()),
      title: orderItem.title,
      sku: orderItem.sku,
      variant: orderItem.variant,
      thumb: orderItem.thumb,
      price: orderItem.price,
      finalprice: orderItem.price,
      category: {
        slug: orderItem.category,
        name: orderItem.category
      },
      vendor: {
        urlpath: orderItem.vendor,
      },
      part: orderItem.part,
      quantity: 1
    };
    throw new Error('Not implemented');
  }
  public static fromProduct(product: Product, variant?: string) {
    const item = {
      timestamp: (new Date()),
      title: product.title,
      sku: product.sku,
      variant,
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
        discount: {threshold: null, amount: 0}
      },
      weight: product.categories.weight,
      discount: product.isDiscount(),
      part: product.pricing.part,
      quantity: 1
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
}

//
// cart
export class CartConfig {
  public namespace: string;
  public gateway: {
    fees: number,
    label: string
  };
  public currency: string;
  public shipping: any|{
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
    this.gateway = {fees: 0, label: 'Aucun'};
    Object.assign(this.shipping, defaultShipping);
  }

}

//
// Cart Cache content
// which is used over time (close/open navigator)
// this should be serialized in server side
class Cache {
  public sync: boolean;
  public list: CartItem[];
  //
  // vendors discounts
  // TODO vendors discount should feet actual vendors settings
  public discount: any;
  public address: DepositAddress|UserAddress;
  public payment: UserCard;
  public currentShippingDay: Date;
  public currentShippingTime: number;
  constructor() {
    this.list = [];
    this.discount = {};
    this.address = new DepositAddress();
    this.payment = new UserCard();
    // shipping dated depends on config...
    // see setContext(...)
    // this.currentShippingDay=Order.nextShippingDay();
    // this.currentShippingTime=16;
  }
}

export class CartModel {
  public cid: string[];
  public address: number;
  public payment: number;
  public items: CartItem[];
  public sync: boolean;
}

@Injectable()
export class CartService {

  private isReady: boolean;
  private headers: HttpHeaders;

  private currentUser: User;
  private currentShops: Shop[] = [];

  private defaultConfig: Config = config;

  //
  // initial cart configuration
  private cartConfig: CartConfig = new CartConfig();

  private cache = new Cache();

  public SHIPPING_COLLECT: string = 'collect';
  public SHIPPING_CENTER: string = 'hypercenter';
  public SHIPPING_PERIPHERY: string = 'periphery';
  public SHIPPING_OTHER: string = 'other';

  public DEFAULT_GATEWAY: any;
  public cart$: ReplaySubject<CartState>;

  constructor(
    private $http: HttpClient
  ) {
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.cache = new Cache();
    this.currentUser = new User();
    this.DEFAULT_GATEWAY = this.cartConfig.gateway;
    //
    // 1 means to keep the last value
    this.cart$ = new ReplaySubject(1);
    this.isReady = false;

    // this.cart$.next({action:CartAction.CART_INIT});
  }

  //
  // API
  //

  //
  // add one item
  public add(product: Product|CartItem, variant?: string) {
    // TODO facebook
    // if(window.fbq)fbq('track', 'AddToCart');
    this.checkIfReady();
    const items = this.cache.list;
    const item = (product instanceof CartItem) ? product : CartItem.fromProduct(product, variant);
    // TODO TSLINT
    for (let i = 0; i < items.length; i++) {
      if (items[i].equalItem(item, variant)) {

        //
        // check availability
        // TODO products should be cached in Cart.cache.products[] to sync vendor/discount and quantity
        if ((product instanceof Product) &&
           product.pricing &&
           product.pricing.stock <= items[i].quantity) {
          // return api.info($rootScope,"La commande maximum pour ce produit à été atteintes.",4000);
          this.cart$.next({item: items[i], action: CartAction.ITEM_MAX});
          return;
        }

        //
        //  fast cart load
        if (items[i].quantity > 10) {
          items[i].quantity += 5;
        } else {
          items[i].quantity++;
        }
        //
        // update the finalprice
        items[i].finalprice = items[i].price * items[i].quantity;

        // TODO warn update
        this.computeVendorDiscount(product.vendor);
        this.save({item: items[i], action: CartAction.ITEM_ADD});
        return;
      }
    }

    items.push(item);
    // TODO warn update
    this.computeVendorDiscount(product.vendor);
    return this.save({item, action: CartAction.ITEM_ADD});
  }

  // clear error
  public clearErrors() {
    const items = this.cache.list;
    // TOFIX  TSLINT
    for (let i = 0; i < items.length; i++) {
      items[i].error = undefined;
    }
  }

  //
  // cart initialisation valid
  public checkIfReady() {
    if (!this.isReady) { throw new Error('Cart is used before initialisation'); }
  }

  //
  // compute discount by vendor
  public computeVendorDiscount(vendor: Shop) {
    // init
    const items = this.cache.list;
    let amount = 0;

    //
    // no discount
    if (!vendor.discount || !vendor.discount.active) {
      this.cache.discount[vendor.urlpath] = 0;
      return 0;
    }

    //
    // subtotal for the vendor
    // TOCHECK  TSLINT
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
    // return the discount
    return this.cache.discount[vendor.urlpath];
  }

  public computeShippingFees(address: UserAddress) {
    this.checkIfReady();
    const total = this.subTotal();
    const postalCode = address.postalCode || '1234567';

    let distance = this.SHIPPING_CENTER;

    //
    // get the base of price depending the shipping sector
    if ((this.cartConfig.shipping.collect || []).indexOf(postalCode) > -1) {
      distance = this.SHIPPING_COLLECT;
    }

    if (this.cartConfig.shipping.periphery.indexOf(postalCode) > -1) {
      distance = this.SHIPPING_PERIPHERY;
    }
    if ((this.cartConfig.shipping.other || []).indexOf(postalCode) > -1) {
      distance = this.SHIPPING_OTHER;
    }

    //
    // get default price for this address
    let price = this.cartConfig.shipping.price[distance];

    //
    // testing deposit address
    // FIXME issue with streetAdress vs. streetAddress
    const deposit = this.defaultConfig.shared.deposits.find((add) => {
      return add.isEqual(address) &&
             add.fees >= 0;
    });
    if (deposit) {
      price = deposit.fees;
    }

    //
    // TODO TESTING MERCHANT ACCOUNT
    // if (user.merchant===true){
    // return Utils.roundAmount(price-this.cartConfig.shipping.priceB);
    // }

    // implement 3) get free shipping!
    if (this.cartConfig.shipping.discountB &&
        total >= this.cartConfig.shipping.discountB) {
      price = (price - this.cartConfig.shipping.priceB);
    } else
    if (this.cartConfig.shipping.discountA &&
        total >= this.cartConfig.shipping.discountA) {
      price = (price - this.cartConfig.shipping.priceA);
    }
    return price;
  }

  //
  // TODO empty should manage recurent items
  public empty() {
    // THOSE should be available
    this.cache.payment = new UserCard();
    this.cache.address = new UserAddress();
    this.cartConfig.gateway = this.DEFAULT_GATEWAY;
    this.cache.sync = false;
    this.cache.list = [];
    this.cache.discount = {};
    this.save({action: CartAction.CART_CLEARED});
  }

  public findBySku(sku: number): CartItem {
    return this.cache.list.find((item) => item.sku === sku);
  }

  public getCurrentGateway(): {fees: number, label: string} {
    this.checkIfReady();
    this.updateGatewayFees();
    return this.cartConfig.gateway;
  }

  //
  // compute amout of
  public gatewayAmount() {
    this.checkIfReady();
    const total = this.subTotal();
    const shipping = this.shipping();
    return this.getCurrentGateway().fees * (total + shipping - this.totalDiscount());
  }

  public getItems() {
    this.checkIfReady();
    return this.cache.list;
  }

  public getCurrentShippingAddress(): UserAddress {
    this.checkIfReady();
    return this.cache.address;
  }

  public getCurrentShippingFees() {
    this.checkIfReady();
    return this.shipping();
  }

  public getCurrentShippingDay() {
    this.checkIfReady();
    return this.cache.currentShippingDay;
  }
  public getCurrentShippingTime() {
    this.checkIfReady();
    return this.cache.currentShippingTime;
  }

  public getCurrentPaymentMethod() {
    return this.cache.payment;
  }

  //
  // TODO should be refactored (distance between real shop settings and cart values)!!
  public getVendorDiscount(slug: string) {
    this.checkIfReady();
    return Utils.roundAmount(this.cache.discount[slug]);
  }

  public hasError(): boolean {
    return this.cache.list.some((item) => item.error !== undefined);
  }

  public hasShippingReduction(): boolean {
    const total = this.subTotal();

    // implement 3) get free shipping!
    if (this.cartConfig.shipping.discountB &&
        total >= this.cartConfig.shipping.discountB) {
      return true;
    } else
    if (this.cartConfig.shipping.discountA &&
        total >= this.cartConfig.shipping.discountA) {
      return true;
    }

    return this.totalDiscount() > 0;
  }

  public isCurrentShippingDayAvailable(shop: Shop): boolean {
    this.checkIfReady();
    const weekday = this.cache.currentShippingDay.getDay();
    return shop.available.weekdays.indexOf(weekday) > -1;
  }

  // NOT available with rx<v6.0
  public loadCart() {
    return this.$http.get<CartModel>(ConfigService.defaultConfig.API_SERVER + '/v1/cart');
  }
  // loadCart():Observable<CartModel>{
  //   return this.$http.get<CartModel>(ConfigService.defaultConfig.API_SERVER + '/v1/cart',{
  //     headers: this.headers,
  //     withCredentials: true
  //   }).pipe(
  //     map(cart=>{
  //     //
  //     // init items
  //     this.cache.list=cart.items.map(item=>new CartItem(item));
  //     //
  //     // FIXME compute vendor discount on load
  //     //this.computeVendorDiscount();
  //     this.clearErrors();

  //     //
  //     // sync with server is done!
  //     this.cache.sync=true;
  //     return cart;
  //   }),
  //   catchError(err=>{
  //     //
  //     // mark sync false
  //     this.cache.sync=false;
  //     return throwError(err);
  //   })
  //   );
  // }

  private initCache(cartCache) {
    //
    // IFF next shipping day is Null (eg. hollidays)=> currentShippingDay
    const nextShippingDay = Order.nextShippingDay() || config.potentialShippingWeek()[0];

    //
    // check shipping date or get the next one
    cartCache.currentShippingDay = new Date(cartCache.currentShippingDay || nextShippingDay);

    //
    // if selected shipping date is before the next one => reset the default date
    if (cartCache.currentShippingDay < nextShippingDay) {
      cartCache.currentShippingDay = nextShippingDay;
    }
    // console.log('cart.service:',cartCache.currentShippingDay<nextShippingDay);
    // console.log('cart.service:',cartCache.currentShippingDay,nextShippingDay);
    cartCache.currentShippingTime = cartCache.currentShippingTime || 16;

    this.cache.currentShippingDay = cartCache.currentShippingDay;
    this.cache.currentShippingTime = cartCache.currentShippingTime;

    //
    // check values
    if (cartCache.list && cartCache.discount) {
      this.cache.list = cartCache.list.map((item) => new CartItem(item));
      this.clearErrors();
      Object.assign(this.cache.discount, cartCache.discount);
    }
    //
    // load only available payment
    if (cartCache.payment) {
      this.cache.payment = new UserCard(cartCache.payment);
      // check validity
      if (!this.cache.payment.isValid()) {
        this.cache.payment = null;
      } else
      if (!this.currentUser.payments.some((payment) => payment.isEqual(this.cache.payment))) {
        this.cache.payment = new UserCard();
      }
    }

    //
    // load address
    if (cartCache.address) {
      this.cache.address = new UserAddress(
        cartCache.address.name,
        cartCache.address.streetAdress,
        cartCache.address.floor,
        cartCache.address.region,
        cartCache.address.postalCode,
        cartCache.address.note,
        cartCache.address.primary,
        cartCache.address.geo
      );

      if ((cartCache.address.fees >= 0)) {
        this.cache.address = ( this.cache.address as DepositAddress);
        this.cache.address['weight'] = cartCache.address.weight;
        this.cache.address['active'] = cartCache.address.active;
        this.cache.address['fees'] = cartCache.address.fees;
        this.cache.address.floor = '-';
      }

      //
      // check existance on the current user (example when you switch account, cart should be sync )
      if (!this.currentUser.addresses.some((address) => address.isEqual(this.cache.address)) &&
          !this.defaultConfig.shared.deposits.some((address) => address.isEqual(this.cache.address))) {
        this.cache.address = new UserAddress();
      }
    }
  }

  public loadContext() {
    //
    // IFF next shipping day is Null (eg. hollidays)=> currentShippingDay
    const nextShippingDay = Order.nextShippingDay() || config.potentialShippingWeek()[0];
    try {
      const cartCache = JSON.parse(localStorage.getItem('kng2-cart'));
      //
      // initial cart on this device
      if (!cartCache) {
        this.cache.currentShippingDay = new Date(nextShippingDay);
        // this.cart$.next({action:CartAction.CART_LOADED,sync:this.cache.sync});
        return;
      }

      //
      // init cart context
      this.initCache(cartCache);

    } catch (e) {
      console.log('------------error on cart loading', e);
      // this.cart$.next({action:CartAction.CART_LOAD_ERROR})
    }
  }

  public removeAll(product: Product|CartItem, variant?: string) {
    this.checkIfReady();
    // init
    const items = this.cache.list;
    const item = (product instanceof CartItem) ? product : CartItem.fromProduct(product);

    //
    for (let i = 0; i < items.length; i++) {
      if (items[i].equalItem(item, variant)) {
        items.splice(i, 1);
        break;
      }
    }
    //
    // update discount amount
    this.computeVendorDiscount(product.vendor);
    return this.save({item, action: CartAction.ITEM_REMOVE});
  }

  public remove(product: Product|CartItem, variant?: string) {
    this.checkIfReady();
    // init
    const items = this.cache.list;
    const item = (product instanceof CartItem) ? product : CartItem.fromProduct(product);

    //
    for (let i = 0; i < items.length; i++) {
      if (items[i].equalItem(item, variant)) {
        // if(items[i].sku===product.sku){
        items[i].quantity -= 1;

        //
        // update the finalprice
        items[i].finalprice = items[i].price * items[i].quantity;

        if (items[i].quantity <= 0) {
          items.splice(i, 1);
        }
        break;
      }
    }
    //
    // update discount amount
    this.computeVendorDiscount(product.vendor);
    return this.save({item, action: CartAction.ITEM_REMOVE});
  }

  //
  // NOT AVAILABLE WITH rxjs<v6
  // TODO  TSLINT
  public save(state: CartState) {}
  // Save with localStorage or api/cart
  // save(state:CartState){
  //   let obs=this.currentUser.isAuthenticated()?
  //       this.saveServer(state):this.saveLocal(state);
  //   obs.pipe(
  //     map(state=>{
  //       this.cart$.next(state);
  //       return state;
  //     }),
  //     catchError(e=>{
  //       //
  //       // FIXME what do we do on error ?
  //       console.log('--',e.message)
  //       console.log('--',e.stack)
  //       this.cart$.next({action:CartAction.CART_SAVE_ERROR})
  //       return this.saveLocal(state);
  //     })
  //   );

  // }

  private saveLocal(state: CartState): Observable<CartState> {
    return Observable.create((observer) => {
      try {
        localStorage.setItem('kng2-cart', JSON.stringify(this.cache));
        this.cache.sync = false;
        observer.next(state);
      } catch (e) {
        observer.error(e);
      }
      observer.complete();
    });
  }

  // NOT AVAILABLE WITH rxjs<v6
  // private saveServer(state:CartState):Observable<CartState>{
  //   return this.$http.post<CartState>(ConfigService.defaultConfig.API_SERVER + '/v1/cart',state, {
  //     headers: this.headers,
  //     withCredentials: true
  //   }).pipe(map(state=>{
  //     //
  //     // sync with server is done!
  //     state.sync=this.cache.sync=true;
  //     return state;
  //   }));
  // }

  //
  // set default user address
  public setShippingAddress(address: UserAddress) {
    this.cache.address = address;
    this.save({action: CartAction.CART_ADDRESS});
  }

  //
  // set default user payment
  public setPaymentMethod(payment: UserCard) {
    this.cache.payment = payment;
    this.updateGatewayFees();
    this.save({action: CartAction.CART_PAYMENT});
  }

  public setShippingDay(newDate: Date, hours?: number) {
    if (newDate.equalsDate(this.cache.currentShippingDay)) {
      return;
    }
    this.cache.currentShippingDay = newDate;
    this.cache.currentShippingTime = hours || 16;
    this.save({action: CartAction.CART_SHPPING});
  }

  //
  // init cart context => load & merge available cart, with current one
  public setContext(config: Config, user: User, shops?: Shop[]) {
    Object.assign(this.defaultConfig, config);
    Object.assign(this.currentUser, user);
    this.currentShops = shops || this.currentShops || [];

    this.cartConfig.shipping = this.defaultConfig.shared.shipping;

    //
    // set default shipping address
    this.cache.address = user.getDefaultAddress();
    this.cache.currentShippingDay = Order.nextShippingDay();
    this.cache.currentShippingTime = 16;

    //
    // load initial context on this device
    this.loadContext();

    this.loadCart().subscribe((state) => {
      this.cart$.next({action: CartAction.CART_LOADED});
      this.isReady = true;
    }, (err) => {
      this.cart$.next({action: CartAction.CART_LOAD_ERROR});
      this.isReady = true;
    });

  }

  public setError(errors) {
    let sku;
    let item;
    for (let i = 0; i < errors.length; i++) {
      sku = Object.keys(errors[i])[0];
      item = this.findBySku(sku);
      if (item) {item.error = errors[i][sku]; }
    }
  }

  public shipping(removeDiscount?: boolean) {
    // check if cart is available

    const total = this.subTotal();
    let price = this.computeShippingFees(this.cache.address);

    // Compute shipping and substract discount
    if (removeDiscount) {
      const fees = this.getCurrentGateway().fees * (total + price);
      price -= Math.max(this.totalDiscount() - fees, 0);
    }

    return Utils.roundAmount(Math.max(price, 0));
  }

  public subTotal(): number {
    const items = this.cache.list;
    let total = 0;
    items.forEach(function(item) {
      total += (item.price * item.quantity);
    });
    return Utils.roundAmount(total);
  }

  /**
   * Subscribe to the user stream.
   */
  public subscribe(
    onNext, onThrow?: ((exception: any) => void)|null,
    onReturn?: (() => void)|null): ISubscription {
      return this.cart$.subscribe({next: onNext, error: onThrow, complete: onReturn});
  }

  public quantity(): number {
    const items = this.cache.list;
    let quantity = 0;
    // TOCHECK TSLINT
    items.forEach((item) => {
      quantity += item.quantity;
    });
    return quantity;
  }

  //
  // total = items + shipping - total discount
  // total = stotal + stotal*payment.fees
  // WARNNG -- WARNNG -- WARNNG -- edit in all places
  public total(): number {
    let total = this.subTotal();
    const shipping = this.shipping();
    const fees = this.getCurrentGateway().fees * (total + shipping - this.totalDiscount()) + shipping;
    total += (fees - this.totalDiscount());

    // Rounding up to the nearest 0.05
    return Utils.roundAmount(total);

  }

  //
  // FIXME, that should be based on the list of all vendors Shop[] (in fact, vendor discount could change )
  public totalDiscount(): number {
    let amount = 0;
    for (const slug in this.cache.discount) {
      amount += this.cache.discount[slug];
    }
    return Utils.roundAmount(amount);
  }

  //
  // set cart tax and return payment label
  public updateGatewayFees(): boolean {
    if (!this.cache.payment) {
      return false;
    }
    if (this.cache.payment.issuer === this.cartConfig.gateway.label) {
      return true;
    }
    //
    // init default one
    this.cartConfig.gateway = this.DEFAULT_GATEWAY;
    return this.defaultConfig.shared.order.gateway.some((gateway) => {
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
