import { HttpHeaders, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReplaySubject, SubscriptionLike as ISubscription, throwError as _throw, Observable, of, throwError, Subject } from 'rxjs';

import { config, Config } from './config';

import { Product } from './product.service';
import { Utils } from './util';

import { Order, OrderItem } from './order/order';
import { Shop } from './shop.service';
import { User, UserAddress, UserCard, DepositAddress } from './user.service';
import { map, catchError, switchMap, debounceTime, tap } from 'rxjs/operators';
import { ConfigService } from './config.service';
import './es5';

//
// on cart action
export enum CartAction {
  ITEM_ADD = "ITEM_ADD",
  ITEM_UPDATE = "ITEM_UPDATE",
  ITEM_REMOVE = "ITEM_REMOVE",
  ITEM_MAX = "ITEM_MAX",
  ITEM_ALL = "ITEM_ALL",
  CART_INIT = "CART_INIT",
  CART_LOADED = "CART_LOADED",
  CART_LOAD_ERROR = "CART_LOAD_ERROR",
  CART_SAVE_ERROR = "CART_SAVE_ERROR",
  CART_ADDRESS = "CART_ADDRESS",
  CART_PAYMENT = "CART_PAYMENT",
  CART_SHIPPING = "CART_SHIPPING",
  CART_CLEARED = "CART_CLEARED",
  CART_SUBSCRIPTION = "CART_SUBSCRIPTION"
}

//
// on cart change
export class CartState {
  item?: CartItem;
  order?: Order;
  action: CartAction;
  server?: CartItem[];
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
  frequency?: CartItemFrequency; // subscription
  active: boolean; // subscription
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
  note?: string;
  audio?: string;
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
  stockLimit?: number;


  static fromProduct(product: Product, hub: string, variant?: string, quantity?: number) {
    product = (product instanceof Product)? product : new Product(product);
    const item = {
      timestamp: (new Date()),
      title: product.title,
      sku: product.sku,
      hub: hub,
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
      quantity: (quantity || 1),
      stockLimit : product.pricing&&product.pricing.stock };
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
    const bSku = (
      this.sku == other.sku && 
      this.hub == other.hub && 
      this.frequency == other.frequency && 
      !this.active
    );
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
      frequency: this.frequency,
      categories: this.category.name,
      vendor: this.vendor.urlpath,
      quantity: this.quantity,
      price: this.price,
      hub: this.hub,
      part: this.part,
      note: this.note,
      audio: this.audio,
      finalprice: this.finalprice
    };

  }
}

//
// get a list of Items in regard of the context
// - forSubscription ==> item with frequency
// - onSubscription ==> item with active subscription (default none)
//
export interface CartItemsContext {
  address?:DepositAddress | UserAddress,
  forSubscription?:boolean| undefined,
  onSubscription?:boolean,
  hub?: string
}

//
// subscription context
export interface CartSubscriptionProductItem{
  unit_amount: number,
  currency:string,
  quantity:number,
  fees:number,
  sku:number|string,
  title:string,
  note: string,
  part: string,
  variant?:string
}

export interface CartSubscriptionServiceItem{
  unit_amount:number,
  quantity:number,
  fees:number,
  id:string
}


export enum CartSchedulerStatus {
  active = "active", 
  paused="paused", 
  pending="pending", 
  incomplete="incomplete", 
  trialing="trialing",
  cancel="cancel"
}
export enum CartItemFrequency {
  ITEM_NONE      = 0,
  ITEM_DAY       = "day",
  ITEM_WEEK      = "week",
  ITEM_2WEEKS    = "2weeks",
  ITEM_MONTH     = "month"
}
export interface CartSubscription {
  id: string,
  customer: string,
  description: string,
  start:Date,
  nextInvoice:Date,
  pauseUntil: Date|0,
  frequency:CartItemFrequency,
  dayOfWeek:number,
  status:string,
  issue?:string,
  latestPaymentIntent:{
    source:string, 
    status:string,
    id:string,
    client_secret:string
  },
  shipping: DepositAddress | UserAddress,
  items: CartSubscriptionProductItem[],
  services: CartSubscriptionServiceItem[],
  errors?:any
};

export interface CartSubscriptionParams{
  dayOfWeek:number,
  frequency: CartItemFrequency|string,
  activeForm:boolean;
}


//
// DEPRECATED: user config.shared instead
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

//
// server content
export class CartModel {
  cid: string | [string];
  items: CartItem[];
  updated: Date;
  reset: Date;
  subscriptionParams: CartSubscriptionParams;
  subscriptions: CartSubscription[];
  constructor() {
    this.items = [];
    // frequency is 1 or 3
    // dayOfWeek is 2,3, 5
    this.subscriptions = [];
    this.subscriptionParams = {
      dayOfWeek:2,
      frequency: "week",
      activeForm: false,
    }
  }
}

//
// Cart Cache content
// which is used over time (close/open navigator)
// this should be serialized in server side
class CartContext extends CartModel {

  //
  // vendors discounts
  // TODO vendors discount should feet actual vendors settings
  address: DepositAddress | UserAddress;
  payment: UserCard;
  currentShippingDay: Date;
  currentShippingTime: number;
  uuid?: string;
  name?: string;
  loaded: boolean;
  constructor() {
    super();
    this.address = new DepositAddress();
    this.payment = new UserCard();
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
  private vendorAmount: any;
  private itemsQtyMap: any;
  private itemsSubsMap: any;


  private defaultConfig: Config = config;

  //
  // initial cart configuration
  private cartConfig: CartConfig = new CartConfig();

  private cache:CartContext;

  private load$: Subject<string>;


  public SHIPPING_COLLECT = 'collect';
  public SHIPPING_CENTER = 'hypercenter';
  public SHIPPING_PERIPHERY = 'periphery';
  public SHIPPING_OTHER = 'other';

  public DEFAULT_GATEWAY: any;
  public cart$: ReplaySubject<CartState>;
  public subscription$: ReplaySubject<CartSubscription[]>;

  constructor(
    private $http: HttpClient
  ) {
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control' : 'no-cache',
      'Pragma' : 'no-cache',
      'ngsw-bypass':'true'
    });
    this.cache = new CartContext();
    this.currentUser = new User();
    this.DEFAULT_GATEWAY = this.cartConfig.gateway;
    //
    // 1 means to keep the last value
    this.cart$ = new ReplaySubject(1);
    this.subscription$ = new ReplaySubject(1);
    this.load$ = new Subject();
    this.isReady = false;
    this.vendorAmount = {};
    this.itemsQtyMap = {};
    this.itemsSubsMap = {};

    this.load$.asObservable().pipe(debounceTime(300)).subscribe((cached)=> {
      this.internalLoad(cached);
    })
    
    // this.cart$.next({action:CartAction.CART_INIT});
  }

  subscriptionsGetAll(): Observable<CartSubscription[]> {
    return this.$http.get<CartSubscription[]>(this.defaultConfig.API_SERVER + '/v1/cart/subscriptions', {
      headers: this.headers,
      withCredentials: true
    })
  }  
  
  subscriptionsGet(): Observable<CartSubscription[]> {
    return this.$http.get<CartSubscription[]>(this.defaultConfig.API_SERVER + '/v1/cart/subscription', {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      catchError((err:HttpErrorResponse) => {
        if(err.status == 401){
          return of([]);
        }
        return throwError(err)
      }),
      tap(subscriptions=> {        
        //
        // server subscription values
        this.cache.subscriptions = subscriptions || [];
        this.subscription$.next(subscriptions);
        return subscriptions;      
      })
    )
  }

  subscriptionPause(subscription:CartSubscription, to:Date): Observable<CartSubscription> {
    return this.$http.post<CartSubscription>(this.defaultConfig.API_SERVER + `/v1/cart/subscription/${subscription.id}/pause`, {to}, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      tap(subscription=> {
        //
        // server subscription values
        const indexSub = this.cache.subscriptions.findIndex(sub => sub.id == subscription.id);
        Object.assign(this.cache.subscriptions[indexSub], subscription);
        this.subscription$.next(this.cache.subscriptions);
        return subscription;
      })
    )
  }

  subscriptionResume(subscription:CartSubscription): Observable<CartSubscription> {
    return this.$http.post<CartSubscription>(this.defaultConfig.API_SERVER + `/v1/cart/subscription/${subscription.id}/resume`, {}, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      tap(subscription=> {
        //
        // server subscription values
        const indexSub = this.cache.subscriptions.findIndex(sub => sub.id == subscription.id);
        Object.assign(this.cache.subscriptions[indexSub], subscription);
        this.subscription$.next(this.cache.subscriptions);
        return subscription;
      })
    )
  }

  subscriptionCancel(subscription:CartSubscription): Observable<CartSubscription> {
    return this.$http.post<CartSubscription>(this.defaultConfig.API_SERVER + `/v1/cart/subscription/${subscription.id}/cancel`, {}, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      tap(subscription=> {
        //
        // server subscription values
        const indexSub = this.cache.subscriptions.findIndex(sub => sub.id == subscription.id);
        Object.assign(this.cache.subscriptions[indexSub], subscription);
        this.subscription$.next(this.cache.subscriptions);
        return subscription;
      })
    )
  }

  // body = {account, frequency, token, payment, product}
  subscriptionCreatePatreon(frequency, payment,product) {
    return this.$http.post<CartSubscription>(this.defaultConfig.API_SERVER + '/v1/cart/patreon', { payment, frequency, product }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      tap(subscription=> {
        //
        // server subscription values
        this.cache.subscriptions.push(subscription)
        this.subscription$.next(this.cache.subscriptions);
        return subscription;
      })
    )

  }


  subscriptionCreate(hub, shipping, items, payment,frequency, dayOfWeek): Observable<CartSubscription> {
    return this.$http.post<CartSubscription>(this.defaultConfig.API_SERVER + '/v1/cart/subscription', { hub, shipping, items, payment, dayOfWeek, frequency }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      tap(subscription=> {
        //
        // server subscription values
        this.cache.subscriptions.push(subscription)
        this.subscription$.next(this.cache.subscriptions);
        return subscription;
      })
    )
  }

  subscriptionPaymentConfirm(sid,intent): Observable<CartSubscription>{
    return this.$http.post<CartSubscription>(this.defaultConfig.API_SERVER + '/v1/cart/subscription/'+sid+'/confirm', { intent }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      tap(subscription=> {
        //
        // server subscription values
        const indexSub = this.cache.subscriptions.findIndex(sub => sub.id == subscription.id);
        Object.assign(this.cache.subscriptions[indexSub], subscription);
        this.subscription$.next(this.cache.subscriptions);
        return subscription;
      })
    )

  }

  subscriptionPaymentUpdate(sid,payment): Observable<CartSubscription>{
    return this.$http.post<CartSubscription>(this.defaultConfig.API_SERVER + '/v1/cart/subscription/'+sid+'/update', { payment }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      tap(subscription=> {
        //
        // server subscription values
        const indexSub = this.cache.subscriptions.findIndex(sub => sub.id == subscription.id);
        Object.assign(this.cache.subscriptions[indexSub], subscription);
        this.subscription$.next(this.cache.subscriptions);
        return subscription;
      })
    )

  }

  subscriptionGetPatreonProducts(): Observable<any> {
    return this.$http.get<any>(this.defaultConfig.API_SERVER + '/v1/cart/patreon', {
      headers: this.headers,
      withCredentials: true
    });
  }



  subscriptionSetParams(params:CartSubscriptionParams) {
    this.cache.subscriptionParams = params;
  }

  subscriptionGetParams():CartSubscriptionParams {
    return this.cache.subscriptionParams;
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
  // update note if item is available
  addOrUpdateNote(item: CartItem, variant?: string){
    const items = this.cache.items;
    const index = items.findIndex(elem => elem.sku == item.sku && elem.hub == item.hub);
    if (index>-1){
      items[index].note =  item.note || items[index].note;        
      items[index].audio = item.audio || items[index].audio;
      this.save({ item: items[index], action: CartAction.ITEM_UPDATE });
      return;
    }
    this.add(item,variant);
  }

  //
  // add one item
  add(product: Product | CartItem, variant?: string, quiet?: boolean) {
    // if(window.fbq)fbq('track', 'AddToCart');
    this.checkIfReady();
    const items = this.cache.items;
    const item = (product instanceof CartItem) ? product : CartItem.fromProduct(product, this.currentHub, variant);

    // console.log('--- ADD ITEM',item.sku,item.hub);

    for (let i = 0; i < items.length; i++) {
      if (items[i].equalItem(item, variant)) {

        //
        // check availability
        // TODO products should be cached in Cart.cache.products[] to sync vendor/discount and quantity
        if (item.stockLimit>0 && item.stockLimit <= items[i].quantity) {
          if (quiet) {
            return;
          }
          this.cart$.next({ item: items[i], action: CartAction.ITEM_MAX });
          return;
        }

        //
        // item already in active Subscription, return max error
        if(this.getSubsQtyMap(item.sku)) {
          if (quiet) {
            return;
          }
          this.cart$.next({ item: items[i], action: CartAction.ITEM_MAX });
          return;
          
        }

        //
        //  fast cart load
        if (items[i].quantity > 6) {
          items[i].quantity += 2;
        } else {
          items[i].quantity++;
        }
        console.log('--DBG add note',item.note,item.audio)
        //
        // update the finalprice and vendor
        items[i].finalprice = items[i].price * items[i].quantity;
        items[i].vendor = item.vendor;
        items[i].note =  items[i].note || item.note;        
        items[i].audio = items[i].audio || item.audio;        

        // TODO warn update
        this.computeVendorDiscount();
        this.computeItemsQtyMap();

        if (quiet) {
          return;
        }
        this.save({ item: items[i], action: CartAction.ITEM_ADD });
        return;
      }
    }


    items.push(item);
    // TODO warn update
    this.computeVendorDiscount();
    this.computeItemsQtyMap();

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
  // FIXME, it should be done by the server
  clearAfterOrder(hub:string, order?:Order,contract?:CartSubscription) {
    // 
    // protect active items from subscriptions
    if(order){
      this.cache.items = this.cache.items.filter(item => item.hub != hub && !item.active);
    }

    // 
    // protect active items from subscriptions
    if(contract) {
      this.cache.items = this.cache.items.filter(item => item.hub != hub && !item.frequency && !item.active);
    }
    this.currentPendingOrder = order || this.currentPendingOrder;
    this.save({ action: CartAction.CART_CLEARED, order });
  }

  broadcastState() {
    this.save({ action: CartAction.CART_CLEARED });
  }

  //
  // cart initialisation valid
  checkIfReady() {
    if (!this.isReady) { throw new Error('Cart is used before initialisation'); }
  }

  //
  computeItemsQtyMap(){
    this.itemsQtyMap = {};
    this.cache.items.filter(item => !item.active).forEach(item => {
      const sku = item.sku + item.hub + (!!item.frequency);      
      this.itemsQtyMap[sku] = item.quantity;
    });
  }

  computeSubsQtyMap(){
    this.itemsSubsMap = {};
    this.cache.items.filter(item => item.active).forEach(item => {
      const sku = item.sku;      
      this.itemsSubsMap[sku] = item.quantity;
    });
  }
  //
  // compute discount by vendor
  // FIXME must be private
  computeVendorDiscount() {
    // init
    this.vendorAmount = {};

    //
    // sum total by vendor
    this.cache.items.forEach(item => {
      const vendor = item.vendor.urlpath + item.hub;      
      if (!this.vendorAmount[vendor]) {
        this.vendorAmount[vendor] = {
          amount: 0, needed:0, discount: {}, hub:item.hub
        };
        Object.assign(this.vendorAmount[vendor].discount, item.vendor.discount, {total: 0});
      }      
      this.vendorAmount[vendor].amount += (item.price * item.quantity);
    });

    //
    // compute available discount
    Object.keys(this.vendorAmount)
          .map(vendor => this.vendorAmount[vendor])
          .filter(vendor => vendor.discount.threshold)
          .forEach(vendor => {
      const amount = vendor.amount;
      const discountMagnitude = Math.floor(amount / vendor.discount.threshold);
      vendor.discount.needed = vendor.discount.threshold - amount % (vendor.discount.threshold | 0) + amount;
      vendor.discount.total = discountMagnitude * vendor.discount.amount;
    });

    //
    // DEBUG
    // Object.keys(this.vendorAmount).forEach(vendor=>{
    //   console.log('--- vendor.discount',vendor,this.vendorAmount[vendor])
    // });
  }  

  //
  // this method start from estimateShippingFees, 
  // and compute the final amount
  computeShippingFees(ctx:CartItemsContext) {
    const address = ctx.address || this.cache.address;

    let {price,status} = this.estimateShippingFeesWithoutReduction(address);

    //
    // 0. testing deposit
    if(status == 'multiple') {
      return price;
    }


    //
    // 1. testing deposit
    if(status == 'deposit') {
      return price;
    }

    //
    // 2. check if user plan is available
    if(status == 'plan') {
      return price;
    }

    //
    // for normal shipping, the price is variable
    const total = this.subTotal(ctx);


    //
    // 3. compute shipping
    if (this.cartConfig.shipping.discountB &&
      total >= this.cartConfig.shipping.discountB) {
      price = Math.max(price - this.cartConfig.shipping.priceB,0);
    } else if (this.cartConfig.shipping.discountA &&
      total >= this.cartConfig.shipping.discountA) {
      price = Math.max(price - this.cartConfig.shipping.priceA,0);
    }

    return price;
  }

  estimateShippingFeesWithoutReduction(address) {
    this.checkIfReady();

    //
    // 1. check if there is a pending order for this address
    if(this.hasShippingReductionMultipleOrder(address)) {
      return {price:0,status:'multiple'};
    }

    //
    // 2. testing deposit
    // FIXME issue with streetAdress vs. streetAddress
    const deposit = this.defaultConfig.shared.hub.deposits.find(add => {
      return UserAddress.isEqual(address,add) &&
        add.fees >= 0;
    });

    if (deposit && deposit.fees>=0) {
      return {price:deposit.fees,status:'deposit'};
    }

    //
    // 3. check if user plan is available
    if(this.currentUser.plan && 
       this.currentUser.plan.defaultShipping >=0 ) {
      return {price:this.currentUser.plan.defaultShipping,status:'plan'};
    }


    //
    // 4. compute shipping fees based on address 
    const postalCode = address&&address.postalCode || '1234567';

    let district = config.getShippingDistrict(postalCode);


    //
    // get default price for this address
    let price = this.cartConfig.shipping.price[district];    

    return {price,status:'shipping'};
  }



  //
  // always look for items that are not in subscription
  // Get the item whatever the frequency is
  findBySku(sku: number, hub: string, frequency?:boolean): CartItem {
    return this.cache.items.find(item => item.sku == sku && item.hub == hub && !!item.frequency == !!frequency &&  !item.active);
  }
  findIndexBySku(sku: number, hub: string, frequency?:boolean): number {
    return this.cache.items.findIndex(item => item.sku == sku && item.hub == hub && !!item.frequency == !!frequency &&  !item.active);
  }


  getCurrentGateway(): { fees: number, label: string } {
    if(!this.isReady){
      return this.cartConfig.gateway;
    }
    this.updateGatewayFees();
    return this.cartConfig.gateway;
  }


  getItemsQtyMap(sku: number, hub: string, frequency?) {
    const item = sku + hub +(!!frequency);      
    return this.itemsQtyMap[item] || 0;
  }

  getSubsQtyMap(sku: number) {
    const item = sku;// + hub ;      
    return this.itemsSubsMap[item] || 0;
  }

  //
  // by default all items without active subscription
  // forSubscription => only for "week" or "month" item
  // onSubscription => include active items
  getItems(ctx:CartItemsContext) {
    const onsubs =ctx.onSubscription ? this.cache.items.filter(item => item.active): [];
    const items = (this.cache.items||[])
    return items.filter(item =>  (!ctx.hub||item.hub == ctx.hub))
                .filter(item =>  (ctx.forSubscription==undefined)||
                                 (ctx.forSubscription==!!item.frequency)).concat(onsubs);                
  }

  getName(){
    return this.cache.name;
  }

  getCID(){
    return this.cache.cid;
  }

  getCurrentShippingAddress(): UserAddress {
    return this.cache.address;
  }


  getShippingDayForMultipleHUBs() {
    const hubsDate = [];
    this.defaultConfig.shared.hubs.forEach(hub => {
      hubsDate.push(Order.fullWeekShippingDays(hub));
    });

    if(hubsDate.length==0){
      return Order.fullWeekShippingDays(this.currentHub);
    }

    if(hubsDate.length==1){
      return hubsDate[0];
    }

    const intersection = hubsDate[0].filter(function(n) {
      return hubsDate[1].indexOf(n) !== -1;
    });    

    //FIXME create intersection for HUBs count > 2
    return intersection;
  }

  getCurrentShippingDay() {
    return this.cache.currentShippingDay;
  }
  getCurrentShippingTime() {
    return this.cache.currentShippingTime;
  }

  getCurrentPaymentMethod() {
    return this.cache.payment;
  }

  //
  // TODO should be refactored (distance between real shop settings and cart values)!!
  getVendorDiscount(item: CartItem) {
    // const vendor = this.vendorAmount[item.vendor.urlpath + item.hub];
    // return vendor ? vendor.discount : 0;
    return 0;
  }

  //
  // FIXME, discount.vendorAmount is DEPRECATED
  // NOTE, discount is based on items that bellongs to the current HUB
  getTotalDiscount(hub: string): number {
    let amount = 0;
    // for (const vendor in this.vendorAmount) {
    //   if(this.vendorAmount.hub == hub) {
    //     amount += (this.vendorAmount[vendor].discount.amount || 0);
    //   }
    // }

    return Utils.roundAmount(amount);
  }


  hasError(hub: string): boolean {
    //
    // get all items to remove at the right position
    const ctx:CartItemsContext = {
      hub: (hub||this.currentHub)
    }

    return this.getItems(ctx).some(item => item.error);
  }

  hasPendingOrder(): Order {
    return (this.currentPendingOrder);
  }

  hasPotentialShippingReductionMultipleOrder(): boolean {
    if(!this.isReady) {
      return false;
    }
    //
    // check if there is a pending order for this address
    if(this.currentPendingOrder && 
       this.currentPendingOrder.shipping){
      const whenDay = this.currentPendingOrder.shipping.when.getDate();
      const nextDay = this.cache.currentShippingDay && this.cache.currentShippingDay.getDate();
      return (whenDay == nextDay );
    }
    return false;
  }


  hasShippingReductionMultipleOrder(address?): boolean {
    const potential = this.hasPotentialShippingReductionMultipleOrder();
    if(!potential){
      return false;
    }
    const pending = UserAddress.from(this.currentPendingOrder.shipping);
    return (UserAddress.isEqual(address,pending));
  }

  //
  // FIXME shipping reduction for pending depends on dst address
  hasShippingReduction(ctx:CartItemsContext) {
    // total items + service fees
    const total = this.subTotal(ctx);
    const address = ctx.address||this.cache.address;

    // return
    const multiple = this.hasShippingReductionMultipleOrder(address);
    let discountA=false, discountB=false, deposit=false;

    if(address && address['fees']>=0) {
      deposit = true;
    }

    if(multiple||deposit){
      return {multiple,discountA,discountB,deposit};
    }

    // implement 3) get free shipping!
    if (this.cartConfig.shipping.discountB &&
      total >= this.cartConfig.shipping.discountB) {
        discountB=true;
    }
    else if (this.cartConfig.shipping.discountA &&
      total >= this.cartConfig.shipping.discountA) {
        discountA=true;
    }

    return {multiple,discountA,discountB,deposit};
  }


  isCurrentShippingDayAvailable(shop: Shop): boolean {
    this.checkIfReady();
    if(!this.cache.currentShippingDay) {
      return false;
    }
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
    const currentShippingDay = config.potentialShippingWeek(this.defaultConfig.shared.hub)[0];
    this.cache.currentShippingDay = new Date(nextShippingDay || currentShippingDay);

    this.cache.updated = new Date('1990-12-01T00:00:00');
    this.cache.uuid = shared;

    try {
      const fromLocal = JSON.parse(localStorage.getItem('kng2-cart')) as CartContext;

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
      // subscription params
      if(fromLocal.subscriptionParams) {
        this.cache.subscriptionParams = fromLocal.subscriptionParams;
      }

      //
      // check existance on the current user (example when you switch account, cart should be sync )
      if (!this.currentUser.addresses.some(address => UserAddress.isEqual(address,this.cache.address)) &&
        !this.defaultConfig.shared.hub.deposits.some(address => UserAddress.isEqual(address,this.cache.address))) {
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
        this.cache.cid = cart.cid? cart.cid[0] : this.cache.cid ;
        this.cache.name = cart.name ;
        this.cache.updated = new Date(cart.updated);
        this.cache.subscriptionParams = this.cache.subscriptionParams || cart.subscriptionParams;
        //
        // FIXME wrong way to check valid items 
        const hubs = this.defaultConfig.shared.hubs.map(hub=>hub.slug);
        this.cache.items = cart.items.filter(item=>hubs.indexOf(item.hub)>-1).map( item => new CartItem(item));


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
        });
        this.computeVendorDiscount();
        this.computeItemsQtyMap();
        this.computeSubsQtyMap();

      }

      //
      // first load initiate cart
      this.isReady = true;

      console.log('---- internal load',this.cache.items)

      this.cart$.next({ action: CartAction.CART_LOADED });
    });

    //
    // TODO
    // this.cart$.next({ action: CartAction.CART_LOAD_ERROR });
  }


  removeAll(product: CartItem, variant?: string) {
    this.checkIfReady();
    //
    // get all items to remove at the right position
    const items = this.cache.items;
    // FIXME same product on multiple hub  will not work
    const indexInCache = this.findIndexBySku(product.sku,product.hub,!!product.frequency);
    if(indexInCache == -1 ){
      return this.save({ item:items[indexInCache], action: CartAction.ITEM_REMOVE });
    }

    const item = items[indexInCache];
    // can not remove item from active sub
    if(item.active) {
      return; 
    }
    // remove all items
    this.cache.items.splice(indexInCache, 1);

    //
    // update discount amount
    this.computeVendorDiscount();
    this.computeItemsQtyMap();

    return this.save({ item, action: CartAction.ITEM_REMOVE });
  }

  remove(product: CartItem, variant?: string) {
    this.checkIfReady();

    //
    // get all items to remove at the right position
    const items = this.cache.items;
    const indexInCache = this.findIndexBySku(product.sku, product.hub,!!product.frequency);
    if(indexInCache == -1 ){
      return this.save({ item:product, action: CartAction.ITEM_REMOVE });
    }
    //
    // always remove one item qty
    product.quantity = 1;
    const item = items[indexInCache];
    //
    // can not remove item from active sub => throw Err('...')
    if(item.active) {
      return; 
    }

    if (items[indexInCache].quantity <= 1) {
      this.cache.items.splice(indexInCache, 1);
    }
    //
    // update the finalprice
    else{
      items[indexInCache].quantity -= 1;
      items[indexInCache].finalprice = items[indexInCache].price * items[indexInCache].quantity;
    }
    //
    // update discount amount
    this.computeVendorDiscount();
    this.computeItemsQtyMap();
    return this.save({ item, action: CartAction.ITEM_REMOVE });
  }

  //
  // save with localStorage
  // save with api/user/cart
  save(state: CartState) {
    state.server = [];

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
        if(!state.server || !state.server.length) {
            this.cache.updated = new Date();
        }
        // console.log('---DEBUG kng2-cart:saveLocal',this.cache);
        if(this.isReady){
          localStorage.setItem('kng2-cart', JSON.stringify(this.cache));
        }
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
    model.items = this.cache.items;
    const errors = model.items.filter(item => item.error);

    if (!this.currentUser.isAuthenticated()) {
      return throwError('Unauthorized');
    }
    const states = [
          CartAction.ITEM_ADD,
          CartAction.ITEM_UPDATE, 
          CartAction.ITEM_REMOVE, 
          CartAction.ITEM_ALL, 
          CartAction.CART_CLEARED, 
          CartAction.CART_SUBSCRIPTION];
    if (states.indexOf(state.action) === -1) {
      return of(state);
    }
    //
    // case of add/remove item
    if (state.item && [CartAction.ITEM_ADD,CartAction.ITEM_UPDATE, CartAction.ITEM_REMOVE].indexOf(state.action) > -1) {
      model.items = [state.item];
      params.action = state.action as CartAction;
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
      state.server = this.cache.items = model.items.map(item => new CartItem(item));
      this.cache.updated = new Date(model.updated);

      //
      // restore errors
      errors.forEach(item => {
        const restored = (this.cache.items.filter(i => i.sku === item.sku));
        restored.forEach(elem => elem.error = item.error);
      });
      //console.log('---DEBUG kng2-cart:saveServer',this.cache.address);
      this.computeSubsQtyMap();

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
    // reset cache address
    if(!address) {
      this.cache.address = new UserAddress();
      return;
    }

    if(UserAddress.isEqual(address,this.cache.address)) {
      return true;
    }

    //
    // check if deposit
    const deposit = this.defaultConfig.shared.hub.deposits.find(add => {
      return UserAddress.isEqual(address,add) && add.fees >= 0;
    });
    
    
    //
    // check if address exist before to save it
    if(!deposit){
      address = this.currentUser.addresses.find(add => UserAddress.isEqual(address,add)) || new UserAddress();
    } else {
      address = deposit;
    }

    //
    // FIXME deposit from HUB a can be set on HUB b
    this.cache.address = address;
    this.save({ action: CartAction.CART_ADDRESS });
    return true;
  }

  //
  // set default user payment
  setPaymentMethod(payment: UserCard) {
    if(UserCard.isEqual(this.cache.payment,payment)) {
      return;
    }
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
    this.save({ action: CartAction.CART_SHIPPING });
  }

  //
  // init cart context => load & merge available cart, with current one
  // - user latest orders (helper for complement)
  setContext(config: Config, user: User, shops?: Shop[], orders?:Order[]) {

    this.currentShops = shops || this.currentShops || [];
    Object.assign(this.currentUser, user);


    //
    // if there is an open order, 
    // - set the default address
    // - set the default date
    orders = (orders||[]).sort((a,b)=> b.oid-a.oid);
    // FIXME this.orders[0].payment.issue is crashing 
    if(orders.length && orders[0].payment) {
      // we can use issuer when the user is set after edition
      const issuer = orders[0].payment.issuer;
      this.cache.payment = this.cache.payment || user.payments.find(payment => payment.issuer == issuer);
      this.cache.address = this.cache.address || UserAddress.from(orders[0].shipping);          
    }
    //
    // EnumFinancialStatus[EnumFinancialStatus.authorized]
    let open = (orders||[]).find(order => order.payment && order.payment.status == 'authorized' && !order.shipping.parent); 
    if(open) {
      this.currentPendingOrder = open;

      const potentialDate = new Date(open.shipping.when);
      const defaultNext = Order.nextShippingDay(user,config.shared.hub);
      if(potentialDate>=defaultNext){
        this.cache.currentShippingDay = potentialDate;
      }

    }    

    //
    // avoid multiple reset on same context
    if(this.currentHub == config.shared.hub.slug) {
      return;
    }
    Object.assign(this.defaultConfig, config);
    this.currentHub = this.defaultConfig.shared.hub.slug;

    this.cartConfig.shipping = this.defaultConfig.shared.shipping;

    //
    // set default shipping address
    this.cache.address = this.cache.address || user.getDefaultAddress();


    if ((this.cache.address['fees'] >= 0)) {
      const deposit = this.cache.address as DepositAddress;
      this.cache.address = new DepositAddress(
        deposit.name,
        deposit['streetAddress'] || deposit.streetAdress,
        deposit.floor,
        deposit.region,
        deposit.postalCode,
        deposit.note,
        deposit.geo,
        deposit.weight,
        deposit.active,
        deposit.fees
      );

    }

    //
    // mark cart ready
    this.load();
  }

  setError(errors, hub) {
    let sku, item;
    for (let i = 0; i < errors.length; i++) {
      sku = Object.keys(errors[i])[0];
      item = this.findBySku(+sku,hub);
      if (item) { item.error = errors[i][sku]; }
    }
  }



  subTotal(ctx:CartItemsContext): number {
    let items = this.getItems(ctx);

    let total = 0;
    items.forEach((item) => {
      total += (item.price * item.quantity);
    });

    const gateway = this.getCurrentGateway();
    const totalFees = config.shared.hub.serviceFees + gateway.fees;

    const fees = (totalFees) * total;
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



  //
  // total = items + shipping - total discount
  // total = stotal + stotal*payment.fees
  // WARNNG -- WARNNG -- WARNNG -- edit in all places
  total(ctx:CartItemsContext): number {
    let total = this.subTotal(ctx);
    const shipping = this.computeShippingFees(ctx);
    const discount = this.getTotalDiscount(ctx.hub);
    total += (shipping - discount);

    // Rounding up to the nearest 0.05
    return Utils.roundAmount(total);

  }


  totalHubFees(ctx:CartItemsContext): number {
    const items = this.getItems(ctx).filter(item => !item.active);
    let total = 0;
    items.forEach((item) => {
      total += (item.price * item.quantity);
    });

    //
    // adding gateway fees
    const gateway = this.getCurrentGateway();
    const totalFees = config.shared.hub.serviceFees + gateway.fees;

    const fees = (totalFees) * total;
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

}

