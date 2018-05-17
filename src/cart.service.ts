import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { config, Config } from './config';
import { ConfigService } from './config.service';

import { Product } from './product.service';
import { Utils } from './util';


import { LoaderService } from './loader.service';
import { OrderService } from './order/order.service';
import { Order, OrderItem } from './order/order';
import { Shop } from './shop.service';
import { User, UserAddress, UserCard, DepositAddress } from './user.service';
import { ISubscription } from 'rxjs/Subscription';

import { _throw } from 'rxjs/observable/throw';
//import { catchError, map, tap } from 'rxjs/operators';

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
  CART_ADDRESS   = 8,
  CART_PAYMENT   = 9,
  CART_SHPPING   =10,
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
  note:string;
  category: {
    slug: string;
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

  //
  // FIXME server need this format, that should be modified
  toDEPRECATED(){
    return{
      sku:this.sku,
      title:this.title,
      variant:this.variant,
      categories:this.category.name,
      vendor:this.vendor.urlpath,
      quantity:this.quantity,
      price:this.price,
      part:this.part,
      note:this.note,
      finalprice:this.finalprice
    };
  
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
        slug: product.categories.slug,
        name: product.categories.name
      },
      vendor: {
        urlpath: product.vendor.urlpath,
        name: product.vendor.name,
        weekdays: product.vendor.available.weekdays,
        photo: product.vendor.photo.owner,
        /* FIXME vendor discount should be managed */ 
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
  gateway:{
    fees:number,
    label:string
  }
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
      average:0, 
      price:{}, 
      priceA:0,
      priceB:0,
      discountA:0,    // half price 5.4@18% & 4.5@15%
      discountB:0,    // 180 full price 11.7@18% & 9.75@15%
      periphery:[],
      others:[],
      collect:[]        
    };
    this.namespace='kng2-cart';
    this.currency='CHF';
    this.shipping={};
    this.gateway={fees:0,label:'Aucun'};
    Object.assign(this.shipping,defaultShipping);
  }

}

//
// Cart Cache content 
// which is used over time (close/open navigator)
// this should be serialized in server side
class Cache {
  list: CartItem[];
  //
  // vendors discounts 
  // TODO vendors discount should feet actual vendors settings
  discount:any;
  address:DepositAddress|UserAddress;
  payment:UserCard;
  currentShippingDay:Date;
  currentShippingTime:number;
  constructor() {
    this.list = [];
    this.discount={};
    this.address=new DepositAddress();
    this.payment=new UserCard();
    // shipping dated depends on config...
    // see setContext(...)
    // this.currentShippingDay=Order.nextShippingDay();
    // this.currentShippingTime=16;
  }
}



@Injectable()
export class CartService {

  private isReady:boolean;
  private cart$: ReplaySubject<CartState>;
  private headers: HttpHeaders;

  private currentUser:User;
  private currentShops:Shop[]=[];

  private defaultConfig:Config=config;

  //
  // initial cart configuration
  private cartConfig:CartConfig=new CartConfig();

  private cache = new Cache();

  public SHIPPING_COLLECT:string='collect';
  public SHIPPING_CENTER:string='hypercenter';
  public SHIPPING_PERIPHERY:string='periphery';
  public SHIPPING_OTHER:string='other';

  public DEFAULT_GATEWAY:any;

  constructor(    
    private $http: HttpClient,
    private $order: OrderService
  ) {
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.cache = new Cache();
    this.currentUser=new User();
    this.DEFAULT_GATEWAY=this.cartConfig.gateway;
    //
    // 1 means to keep the last value
    this.cart$ = new ReplaySubject(1);
    this.isReady=false;
    
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
    this.checkIfReady();
    let items=this.cache.list;
    let item=(product instanceof CartItem)?product:CartItem.fromProduct(product);


    for(var i=0;i<items.length;i++){
      if(items[i].equalItem(item,variant)){

        //
        // check availability
        // TODO products should be cached in Cart.cache.products[] to sync vendor/discount and quantity
        if((product instanceof Product)&&
           product.pricing&&
           product.pricing.stock<=items[i].quantity){
          // return api.info($rootScope,"La commande maximum pour ce produit à été atteintes.",4000);
          this.cart$.next({item:items[i],action:CartAction.ITEM_MAX});
          return;
        }

        //
        //  fast cart load
        if(items[i].quantity>15){
          items[i].quantity+=5;
        }else if(items[i].quantity>3){
          items[i].quantity+=3;
        }else{
          items[i].quantity++;
        }
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

  // clear error 
  clearErrors(){
    let items=this.cache.list;
    for(var i=0;i<items.length;i++){
      items[i].error=undefined;
    }
  }
  
  //
  // cart initialisation valid
  checkIfReady(){
    if(!this.isReady){ throw new Error("Cart is used before initialisation");}    
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

    //
    // subtotal for the vendor
    items.forEach(function (item) {
      if(item.vendor.urlpath==vendor.urlpath){
        amount+=(item.price*item.quantity);
      }
    });

    //
    // compute discount based on vendor
    var discountMagnitude=Math.floor(amount/vendor.discount.threshold);
    this.cache.discount[vendor.urlpath]=discountMagnitude*vendor.discount.amount

    //
    // return the discount
    return this.cache.discount[vendor.urlpath];
  }  


  computeShippingFees(address:UserAddress){
    this.checkIfReady();
    let total=this.subTotal();
    let postalCode=address.postalCode||'1234567';
    
    let distance=this.SHIPPING_CENTER;

    
    //
    // get the base of price depending the shipping sector
    if((this.cartConfig.shipping.collect||[]).indexOf(postalCode)>-1){
      distance=this.SHIPPING_COLLECT;
    }
    
    if(this.cartConfig.shipping.periphery.indexOf(postalCode)>-1){
      distance=this.SHIPPING_PERIPHERY;
    }
    if((this.cartConfig.shipping.other||[]).indexOf(postalCode)>-1){
      distance=this.SHIPPING_OTHER;
    }
    
    //
    // get default price for this address
    let price=this.cartConfig.shipping.price[distance];

    //
    // testing deposit address
    // FIXME issue with streetAdress vs. streetAddress
    let deposit=this.defaultConfig.shared.deposit.find(add=>{
      return add.isEqual(address)&&
             add.fees>=0;
    });
    if(deposit){
      price=deposit.fees;
    }

    //
    // TODO TESTING MERCHANT ACCOUNT
    //if (user.merchant===true){
    // return Utils.roundAmount(price-this.cartConfig.shipping.priceB);
    //}

    
    // implement 3) get free shipping!
    if (this.cartConfig.shipping.discountB&&
        total>=this.cartConfig.shipping.discountB){
      price=(price-this.cartConfig.shipping.priceB);
    }

    // implement 3) get half shipping!
    else 
    if (this.cartConfig.shipping.discountA&&
        total>=this.cartConfig.shipping.discountA){
      price=(price-this.cartConfig.shipping.priceA);
    }
    return price;
  }

  //
  // TODO empty should manage recurent items
  empty(){    
    // THOSE should be available
    this.cache.payment=new UserCard();
    this.cache.address=new UserAddress();
    this.cartConfig.gateway=this.DEFAULT_GATEWAY;
    this.cache.list=[];      
    this.cache.discount={};
    this.save({action:CartAction.CART_CLEARED});
  }
  
  findBySku(sku:number):CartItem{
    return this.cache.list.find(item=>item.sku==sku);
  }
  
  getCurrentGateway():{fees:number,label:string}{
    this.checkIfReady();
    this.updateGatewayFees();
    return this.cartConfig.gateway;
  }

  //
  // compute amout of 
  gatewayAmount(){
    this.checkIfReady();
    let total=this.subTotal(), 
        shipping=this.shipping();    
    return this.getCurrentGateway().fees*(total+shipping-this.totalDiscount());      
  }
   
  getItems(){
    this.checkIfReady();
    return this.cache.list;
  }

  getCurrentShippingAddress():UserAddress{
    this.checkIfReady();
    return this.cache.address;
  }

  getCurrentShippingFees(){
    this.checkIfReady();
    return this.shipping();
  }

  getCurrentShippingDay() {
    this.checkIfReady();
    return this.cache.currentShippingDay;
  }
  getCurrentShippingTime(){
    this.checkIfReady();
    return this.cache.currentShippingTime;
  }

  getCurrentPaymentMethod(){
    return this.cache.payment;
  }

  //
  // TODO should be refactored (distance between real shop settings and cart values)!!
  getVendorDiscount(slug:string){
    this.checkIfReady();
    return Utils.roundAmount(this.cache.discount[slug]);
  }

  hasError():boolean{
    return this.cache.list.some(item=>item.error!=undefined);
  }
  
  hasShippingReduction():boolean {
    let total=this.subTotal();

    // implement 3) get free shipping!
    if (this.cartConfig.shipping.discountB&&
        total>=this.cartConfig.shipping.discountB){
      return true;
    }

    // implement 3) get half shipping!
    else 
    if (this.cartConfig.shipping.discountA&&
        total>=this.cartConfig.shipping.discountA){
      return true;
    }

    return this.totalDiscount()>0;
  }

  isCurrentShippingDayAvailable(shop:Shop):boolean{
    this.checkIfReady();
    let weekday=this.cache.currentShippingDay.getDay();
    return shop.available.weekdays.indexOf(weekday)>-1;
  }


  load(){
    let nextShippingDay=Order.nextShippingDay();
    let currentShippingDay=Order.currentShippingDay();
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
      // check shipping date or get the next one
      cartCache.currentShippingDay=new Date(cartCache.currentShippingDay||nextShippingDay);

      //
      // if selected shipping date is before the next one => reset the default date
      if(cartCache.currentShippingDay<nextShippingDay){
        cartCache.currentShippingDay=nextShippingDay;
      }
      cartCache.currentShippingTime=cartCache.currentShippingTime||16;

      this.cache.currentShippingDay=cartCache.currentShippingDay;
      this.cache.currentShippingTime=cartCache.currentShippingTime;
      
      //
      // check values
      if(cartCache.list&&cartCache.discount){
        this.cache.list=cartCache.list.map(item=>new CartItem(item))
        Object.assign(this.cache.discount,cartCache.discount);      
      }
      //
      // load only available payment
      if(cartCache.payment){
        this.cache.payment=new UserCard(cartCache.payment);
        // check validity
        if(!this.cache.payment.isValid()){
          this.cache.payment=null;
        }
        // check existance on the current user (example when you switch account, cart should be sync )
        else if(
          !this.currentUser.payments.some(payment=>payment.isEqual(this.cache.payment))){
          this.cache.payment=new UserCard();
        }
      }
      
      //
      // load address
      if(cartCache.address){
        let AddressConstructor=(this.cache.address['fees']>=0)? DepositAddress:UserAddress;
        this.cache.address=new UserAddress(
          cartCache.address.name,
          cartCache.address.streetAdress,
          cartCache.address.floor,
          cartCache.address.region,
          cartCache.address.postalCode,
          cartCache.address.note,
          cartCache.address.primary,
          cartCache.address.geo
        );  
              
        if((cartCache.address.fees>=0)){
          this.cache.address=<DepositAddress>this.cache.address;
          this.cache.address['weight']=cartCache.address.weight;
          this.cache.address['active']=cartCache.address.active;
          this.cache.address['fees']=cartCache.address.fees;       
          this.cache.address.floor='-';
        }

        //     
        // check existance on the current user (example when you switch account, cart should be sync )
        if(!this.currentUser.addresses.some(address=>address.isEqual(this.cache.address))&&
           !this.defaultConfig.shared.deposit.some(address=>address.isEqual(this.cache.address))){
          this.cache.address=new UserAddress();
        }
      }
    

      this.cart$.next({action:CartAction.CART_LOADED});
    }catch(e){
      console.log('------------error on cart loading',e)
      this.cart$.next({action:CartAction.CART_LOAD_ERROR})
    }
  }

  remove(product:Product|CartItem, variant?:string) {
    this.checkIfReady();
    // init
    let items=this.cache.list;
    let item=(product instanceof CartItem)?product:CartItem.fromProduct(product);

    // 
    for (var i = 0; i < items.length; i++) {
      if (items[i].equalItem(item, variant)) {
        // if(items[i].sku===product.sku){
          if(items[i].quantity>15){
            items[i].quantity-=3;
          }else if(items[i].quantity>6){
            items[i].quantity-=2;
          }else{
            items[i].quantity-=1;
          }

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
   
  //
  // set default user address
  setShippingAddress(address:UserAddress){
    this.cache.address=address;
    this.save({action:CartAction.CART_ADDRESS})
  }

  //
  // set default user payment
  setPaymentMethod(payment:UserCard){
    this.cache.payment=payment;
    this.updateGatewayFees();
    this.save({action:CartAction.CART_PAYMENT});
  }

  setShippingDay(newDate:Date, hours?:number) {
    this.cache.currentShippingDay=newDate;
    this.cache.currentShippingTime=hours||16;
    this.save({action:CartAction.CART_SHPPING})
  }

  //
  // init cart context => load & merge available cart, with current one
  setContext(config:Config,user:User,shops?:Shop[]){
    Object.assign(this.defaultConfig,config);
    Object.assign(this.currentUser,user);
    this.currentShops=shops||this.currentShops||[];

    this.cartConfig.shipping=this.defaultConfig.shared.shipping;    

    //
    // set default shipping address
    this.cache.address=user.getDefaultAddress();
    this.cache.currentShippingDay=Order.nextShippingDay();
    this.cache.currentShippingTime=16;

    //
    // mark cart ready
    this.isReady=true;
    this.load();
  }
  
  setError(errors){
    let sku, item;
    for(let i=0;i<errors.length;i++){
      sku=Object.keys(errors[i])[0];
      item=this.findBySku(sku);
      if (item)item.error=errors[i][sku];
    }
  }


  shipping(removeDiscount?:boolean){
    // check if cart is available

    let total=this.subTotal();
    let price=this.computeShippingFees(this.cache.address);


    //Compute shipping and substract discount
    if(removeDiscount){
      var fees=this.getCurrentGateway().fees*(total+price);
      price-=Math.max(this.totalDiscount()-fees,0);
    }

    return Utils.roundAmount(Math.max(price,0));
  }


  subTotal():number{
    let items=this.cache.list;
    let total = 0;
    items.forEach(function (item) {
      total += (item.price*item.quantity);
    });
    return Utils.roundAmount(total);
  }
  

  /**
   * Subscribe to the user stream.
   */
  subscribe(
    onNext, onThrow?: ((exception: any) => void)|null,
    onReturn?: (() => void)|null): ISubscription {
      return this.cart$.subscribe({next: onNext, error: onThrow, complete: onReturn});
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
  // total = items + shipping - total discount
  // total = stotal + stotal*payment.fees
  // WARNNG -- WARNNG -- WARNNG -- edit in all places 
  total():number{
    let total=this.subTotal(), shipping=this.shipping();    
    let fees=this.getCurrentGateway().fees*(total+shipping-this.totalDiscount())+shipping;
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

  //
  // set cart tax and return payment label
  updateGatewayFees():boolean{
    if(!this.cache.payment){
      return false;
    }
    if(this.cache.payment.issuer==this.cartConfig.gateway.label){
      return true
    }
    //
    // init default one
    this.cartConfig.gateway=this.DEFAULT_GATEWAY;
    return this.defaultConfig.shared.order.gateway.some(gateway=>{
      // TODO check issuer vs type
      if(gateway.label===this.cache.payment.issuer){
        this.cartConfig.gateway=gateway;
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
  };
}
