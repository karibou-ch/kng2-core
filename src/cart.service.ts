import { Http, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { config, Config } from './config';
import { ConfigService } from './config.service';

import { Product } from './product.service';
import { Utils } from './util';

import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';

import { LoaderService } from './loader.service';
import { OrderService } from './order/order.service';
import { Order, OrderItem } from './order/order';
import { Shop } from './shop.service';
import { User, UserAddress } from './user.service';
import { ISubscription } from 'rxjs/Subscription';

//
// on recurrent order
export enum CartItemFrequency {
  ITEM_WEEK      = 0,
  ITEM_2WEEKS    = 1,
  ITEM_MONTH     = 2,
  ITEM_QUARTER   = 3
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
  CART_CLEARED   = 0
}

//
// on cart change
export class CartState{
  item?:CartItem;
  action:CartAction;
}

//
// cart content
export class CartItem {
  deleted?: boolean;
  frequency?:CartItemFrequency;
  timestamp: Date;
  title: string;
  sku: number;
  variant: string;
  thumb: string;
  price: number;
  finalprice: number;
  weight: number;
  error?:string;
  category: {
    id: string;
    name: string;
  }
  vendor: {
    urlpath: string;
    name: string;
    weekdays: number[];
    photo: string;
    discount:{
      threshold?:number;
      amount?:number;
    }
  }
  discount: boolean;
  part: string;
  quantity: number;

  constructor(item: any|CartItem) {
    // avoid UI artefact on loading 
    item['selected']=undefined;
    Object.assign(this,item);
  }

  equalItem(other: CartItem, variant?:string) {
    let bSku = this.sku == other.sku;
    if (!variant) {
      return bSku;
    }
    return (this.variant &&
      this.variant == variant &&
      bSku);
  }

  static fromOrder(orderItem:OrderItem){
    let item={

    }
    throw new Error("Not implemented");
  }
  static fromProduct(product:Product,variant?:string){
    let item={
      timestamp:(new Date()),
      title:product.title,
      sku:product.sku,
      variant:variant,
      thumb:product.photo.url,
      price:product.getPrice(),
      finalprice:product.getPrice(),
      category: {
        id: product.categories.slug,
        name: product.categories.name
      },
      vendor: {
        id: product.vendor.urlpath,
        name: product.vendor.name,
        weekdays: product.vendor.available.weekdays,
        photo: product.vendor.photo.owner,
        discount: {threshold:null,amount:0}
      },          
      weight:product.categories.weight,
      discount:product.isDiscount(),
      part:product.pricing.part,
      quantity:1
    };
    //
    // init discount 
    // TODO howto manage discount link
    if(product.vendor.discount&&
      product.vendor.discount.active){
      item.vendor.discount.threshold=parseFloat(product.vendor.discount.threshold);
      item.vendor.discount.amount=parseFloat(product.vendor.discount.amount);

    }
    return new CartItem(item);
  }
}

//
// cart
export class CartConfig{
  namespace:string;
  taxName:string;
  tax:number;
  currency:string;
  shipping:any|{
    average:number;
    price:{
      hypercenter:number;
      periphery:number; 
      others:number; 
    }
    //
    // discount amount  
    priceA:number;
    priceB:number;
    //
    // discount threshold
    discountA:number;    // half price 5.4@18% & 4.5@15%
    discountB:number;    // 180 full price 11.7@18% & 9.75@15%

    //
    // postalCodes 
    periphery:string[];            
    others:string[];
  }
  
  constructor(){
    let defaultShipping={
      // average 
      average:115, 
      price:{
        hypercenter:11.9,
        periphery:14.90
      }, 
      priceA:0,
      priceB:0,
      discountA:145,    // half price 5.4@18% & 4.5@15%
      discountB:180,    // 180 full price 11.7@18% & 9.75@15%
      periphery:[],
      others:[]        
    };
    this.namespace='kng2-cart';
    this.tax=0;
    this.taxName='Aucun';
    this.currency='CHF';
    this.shipping={};
    Object.assign(this.shipping,defaultShipping);
  }

}

class Cache {
  list: CartItem[];
  //
  // vendors discounts 
  // TODO vendors discount should feet actual vendors settings
  discount:any;
  constructor() {
    this.list = [];
    this.discount={};
  }
}



@Injectable()
export class CartService {

  private cart$: ReplaySubject<CartState>;
  private headers: Headers;

  private currentUser:User;
  private currentShops:Shop[];

  private defaultConfig:Config=config;

  private defaultAddress:UserAddress;
  //
  // initial cart configuration
  private defaultCartConfig:CartConfig=new CartConfig();

  private cache = new Cache();

  constructor(    
    private $http: Http,
    private $order: OrderService
  ) {
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
    this.cache = new Cache();
    this.currentUser=new User();
    this.defaultAddress=new UserAddress();
    //
    // 1 means to keep the last value
    this.cart$ = new ReplaySubject(1);
    //this.cart$.next({action:CartAction.CART_INIT});
  }

  //
  // API
  //



  //
  // add one item
  add(product:Product|CartItem, variant?:string){
    //TODO facebook
    //if(window.fbq)fbq('track', 'AddToCart');
    let items=this.cache.list;
    let item=(product instanceof CartItem)?product:CartItem.fromProduct(product);


    for(var i=0;i<items.length;i++){
      if(items[i].equalItem(item,variant)){

        //
        // check availability
        // TODO products should be cached in Cart.cache.products[] to sync vendor/discount and quantity
        if(product instanceof Product&&
           product.pricing&&
           product.pricing.stock<=items[i].quantity){
          // return api.info($rootScope,"La commande maximum pour ce produit à été atteintes.",4000);
          this.cart$.next({item:items[i],action:CartAction.ITEM_MAX});
          return;
        }

        items[i].quantity++;
        //
        // update the finalprice
        items[i].finalprice=items[i].price*items[i].quantity;

        // TODO warn update
        this.computeVendorDiscount(product.vendor);        
        this.save({item:items[i],action:CartAction.ITEM_ADD});
        return;
      }
    }


    items.push(item);
    // TODO warn update
    this.computeVendorDiscount(product.vendor);    
    return this.save({item:item,action:CartAction.ITEM_ADD});
  }

  //
  // compute discount by vendor
  computeVendorDiscount(vendor:Shop) {
    // init
    let items=this.cache.list;
    let amount=0;

    //
    // no discount
    if(!vendor.discount||!vendor.discount.active){
      this.cache.discount[vendor.urlpath]=0;
      return 0;
    }


    items.forEach(function (item) {
      if(item.vendor.urlpath==vendor.urlpath){
        amount+=(item.price*item.quantity);
      }
    });

    //
    // compute discount based on vendor
    var discountMagnitude=Math.floor(amount/vendor.discount.threshold);
    this.cache.discount[vendor.urlpath]=discountMagnitude*vendor.discount.amount

    return this.cache.discount[vendor.urlpath];
  }  

  //
  // init cart context => load & merge available cart, with current one
  setContext(config:Config,user:User,shops?:Shop[]){
    Object.assign(this.defaultConfig,config);
    Object.assign(this.currentUser,user);
    if(shops)this.currentShops=shops;
    this.defaultCartConfig.shipping=this.defaultConfig.shared.shipping;
    this.load();
  }

  getItems(){
    return this.cache.list;
  }


  getShippingDay() {

  }

  getVendorDiscount(slug:string){
    return Utils.roundAmount(this.cache.discount[slug]);
  }

  
  isWeekdaysAvailable() {

  }




  load(){
    // this.$order.findOrdersByUser(this.currentUser).subscribe(
    //   (orders:Order[])=>{

    //   },error=>{

    //   }
    // );
    try{
      let cartCache=JSON.parse(localStorage.getItem('kng2-cart'));
      if(!cartCache){
        return;
      }
      
      //
      // check values
      if(cartCache.list&&cartCache.discount){
        this.cache.list=cartCache.list.map(item=>new CartItem(item))
        Object.assign(this.cache.discount,cartCache.discount);      
      }
      this.cart$.next({action:CartAction.CART_LOADED});
    }catch(e){
      this.cart$.next({action:CartAction.CART_LOAD_ERROR})
    }
  }

  remove(product:Product|CartItem, variant?:string) {
    // init
    let items=this.cache.list;
    let item=(product instanceof CartItem)?product:CartItem.fromProduct(product);

    // 
    for (var i = 0; i < items.length; i++) {
      if (items[i].equalItem(item, variant)) {
        // if(items[i].sku===product.sku){
        items[i].quantity--;

        //
        // update the finalprice
        items[i].finalprice = items[i].price * items[i].quantity;

        if (items[i].quantity === 0) {
          items.splice(i, 1);
        }
        break;
      }
    }
    //
    // update discount amount
    this.computeVendorDiscount(product.vendor);
    return this.save({item:item,action:CartAction.ITEM_REMOVE});
  }

  //
  // save with localStorage
  // save with api/user/cart
  save(state:CartState){
    try{
      localStorage.setItem('kng2-cart', JSON.stringify(this.cache));    
      this.cart$.next(state);
    }catch(e){
      this.cart$.next({action:CartAction.CART_SAVE_ERROR})
    }
  }
    
  setShippingDay(weekIndex, hours) {

  }

  shippingTimeLabel() {

  }


  setError(errors){
    let sku, item;
    for(let i=0;i<errors.length;i++){
      sku=Object.keys(errors[i])[0];
      item=this.findBySku(sku);
      if (item)item.error=errors[i][sku];
    }
  }


  // clear error 
  clearErrors(){
    let items=this.cache.list;
    for(var i=0;i<items.length;i++){
      items[i].error=undefined;
    }
  }


  findBySku(sku:number):CartItem{
    return this.cache.list.find(item=>item.sku==sku);
  }

  hasError():boolean{
    return this.cache.list.some(item=>item.error!=undefined);
  }
  

  hasShippingReduction():boolean {
    let total=this.subTotal();

    // implement 3) get free shipping!
    if (this.defaultCartConfig.shipping.discountB&&
        total>=this.defaultCartConfig.shipping.discountB){
      return true;
    }

    // implement 3) get half shipping!
    else 
    if (this.defaultCartConfig.shipping.discountA&&
        total>=this.defaultCartConfig.shipping.discountA){
      return true;
    }

    return this.totalDiscount()>0;
  };


  isShippingHypercenter(user:User):boolean {
    var postalCode;
    postalCode=this.defaultAddress&&this.defaultAddress.postalCode;
    
    postalCode=postalCode||user.getDefaultAddress().postalCode;
    if(!postalCode ){
      return true;
    }

    if(this.defaultCartConfig.shipping.periphery.indexOf(postalCode)>-1){
      return false;
    }
    return true;
  }


  getQuantityBySku(sku:number){
    let item=this.findBySku(sku);
    return item?item.quantity:0;
  }

  getShippingSectorPrice(postalCode) {
    if(!postalCode ){
      return 'hypercenter';
    }
    if(this.defaultCartConfig.shipping.periphery.indexOf(postalCode)!==-1){
      return 'periphery';
    }
    return 'hypercenter';
  };

  shipping(removeDiscount?:boolean){
    let total=this.subTotal();
    //let addressIdx=this.defaultAddress||0;
    
    //
    // See order for order part of implementation

    //
    // get the base of price depending the shipping sector


    let distance=this.getShippingSectorPrice(this.defaultAddress.postalCode);
    let price=this.defaultCartConfig.shipping.price[distance];

    

    //
    // TODO TESTING MERCHANT ACCOUNT
    //if (user.merchant===true){
    // return Utils.roundAmount(price-this.defaultCartConfig.shipping.priceB);
    //}

    
    // implement 3) get free shipping!
    if (this.defaultCartConfig.shipping.discountB&&
        total>=this.defaultCartConfig.shipping.discountB){
      price=(price-this.defaultCartConfig.shipping.priceB);
    }

    // implement 3) get half shipping!
    else 
    if (this.defaultCartConfig.shipping.discountA&&
        total>=this.defaultCartConfig.shipping.discountA){
      price=(price-this.defaultCartConfig.shipping.priceA);
    }

    // WTF is this param?
    if(removeDiscount){
      var fees=this.tax()*(total+price);
      price-=Math.max(this.totalDiscount()-fees,0);
    }

    return Utils.roundAmount(Math.max(price,0));
  }

  setTax(tax, label){
    this.defaultCartConfig.taxName=label;
    this.defaultCartConfig.tax=tax;
  }    

  subTotal():number{
    let items=this.cache.list;
    let total = 0;
    items.forEach(function (item) {
      total += (item.price*item.quantity);
    });
    return Utils.roundAmount(total);
  }
  
  
  tax(){
    return this.defaultCartConfig.tax;
  }

  taxName(){
    return this.defaultCartConfig.taxName;
  }

  
  //
  // total = items + shipping - total discount
  // total = stotal + stotal*payment.fees
  // WARNNG -- WARNNG -- WARNNG -- edit in all places 
  total():number{
    let total=this.subTotal(), shipping=this.shipping();    
    let fees=this.tax()*(total+shipping-this.totalDiscount())+shipping;
    total+=(fees-this.totalDiscount());

    // Rounding up to the nearest 0.05
    return Utils.roundAmount(total);

  }  

  //
  // FIXME, that should be based on the list of all vendors Shop[] (in fact, vendor discount could change )
  totalDiscount():number {
    var amount=0;
    for(let slug in this.cache.discount){
      amount+=this.cache.discount[slug];
    }
    return Utils.roundAmount(amount);
  }
  
  quantity():number{
    let items=this.cache.list;
    let quantity = 0;
    items.forEach(function (item) {
      quantity += item.quantity;
    });
    return quantity;
  }
  

  //
  // TODO empty should manage recurent items
  empty=function(){
    this.cache.list=[];      
    this.cache.discount={};
    this.save();
  };


  /**
   * Subscribe to the user stream.
   */
  subscribe(
    onNext, onThrow?: ((exception: any) => void)|null,
    onReturn?: (() => void)|null): ISubscription {
      return this.cart$.subscribe({next: onNext, error: onThrow, complete: onReturn});
  }  
  
  unsubscribe(){
    //return this.cart$.unsubscribe();
  }
  


  //
  // REST api wrapper
  //


  //
  // get product based on its sku
  // get(sku): Observable<CartItem> {
  //     let cached: Observable<CartItem>;

  //     // check if in the cache
  //     if (this.cache.map.get(sku)) {
  //         return Observable.of(this.cache.map.get(sku));
  //     }
  //     return this.http.get(this.config.API_SERVER + '/v1/products/' + sku, {
  //         headers: this.headers,
  //         withCredentials: true
  //     })
  //       .map(res => this.updateCache(res.json()))
  // };

  // remove(sku:number,password:string):Observable<any>{
  //   var passwordJson = {"password":password};
  //   return this.http.put(this.config.API_SERVER + '/v1/products/'+sku, passwordJson, {
  //     headers: this.headers,
  //     withCredentials: true
  //   })
  //   .map(res => this.deleteCache(res.json()))
  //     .do(this.cart$.next.bind(this.cart$))
  // };

  // create(prod: CartItem): Observable<CartItem> {
  //     //
  //     // FIXME creattion code is not correct
  //     return this.http.post(this.config.API_SERVER + '/v1/shops/chocolat-de-villars-sur-glane/products/', prod, {
  //         headers: this.headers,
  //         withCredentials: true
  //     })
  //         .map(res=>this.updateCache(res.json()))
  //         .do(this.cart$.next.bind(this.cart$));
  // };

  // save(prod: CartItem): Observable<CartItem> {
  //     return this.http.post(this.config.API_SERVER + '/v1/products/' + prod.sku, prod, {
  //         headers: this.headers,
  //         withCredentials: true
  //     })
  //         .map(res => this.updateCache(res.json()))
  //         .do(this.cart$.next.bind(this.cart$));
  // };

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
    console.error(errMsg);
    return Observable.throw(errMsg);
  };
}

