import { Http, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { ConfigService } from '../config.service'

import { 
  EnumCancelReason, 
  EnumFinancialStatus, 
  EnumFulfillments, 
  EnumOrderIssue, 
  EnumShippingMode 
} from './order.enum';

import { Order } from './order';


@Injectable()
export class OrderService {

  private defaultOrder = {
    name: '',
    weight: 0,
    description: "",
    group: ""
  };
  
  // TODO make observable content !!
  // TODO orders depends on user and shops
  config:any;
  headers: Headers;

  constructor(
    private http: Http, 
    private configSrv: ConfigService
  ) {
    //
    // TODO wait for observale!
    this.config=configSrv.config;    
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
  }


  //
  // common cache functions
  private cache: {
    list: Order[];
    map: Map<string, Order>; //key is a slug
  }


  private updateCache(order: Order) {
    if (this.cache.map[order.oid])
      return Object.assign(this.cache.map[order.oid], order);
  }

  private deleteCache(order: Order) {
    if (this.cache.map[order.oid]) {
      let index = this.cache.list.indexOf(order)
      if (index > -1)
        this.cache.list.splice(index, 1);
      delete this.cache.map[order.oid];
    }
  }

  private addCache(order:Order){
    //
    //check if already exist on cache and add in it if not the case
    if (!this.cache.map[order.oid]){
      this.cache.map[order.oid] = order;
      this.cache.list.push(order);
      return order;
    }
    //update existing entry
    return Object.assign(this.cache.map[order.oid],Order);    
  }


  //
  // common order services
  // TODO should be splited on differents services and classes

  //
  // create a new order
  // role:client
  create(shipping,items,payment){
    //backend.$order.save({shipping:shipping,items:items,payment:payment}, function() {      
  }

  //
  // mail [all|specified] vendors for orders
  // role:admin|shop
  informShopToOrders(shop:string,when:Date,fulfillment:EnumFulfillments){
    //shop=shop||'shops'; // specified shop or all shops
    //return this.chain(backend.$order.inform({action:shop,id:'email'},{when:when,fulfillments:fulfillment}).$promise);
  };

  // update effective bags for this order
  // role:logistic
  updateBagsCount(order:Order, value:number){
    //var status=this.shipping.shipped;
    //return this.chain(backend.$order.save({action:this.oid,id:'shipping'},{bags:value,status:status}).$promise);
  };

  // remove this order
  // role:admin only
  // TODO should be password protected
  remove(order:Order){
    //return this.chain(backend.$order.save({action:this.oid,id:'remove'}).$promise);
  };

  // capture this order
  // role:admin only
  // TODO opts ??
  capture(order:Order,opts){
    // opts=opts||{};
    // return this.chain(backend.$order.save({action:this.oid,id:'capture'},opts).$promise);
  };

  // refund an order
  // role:admin or shop (when partial)
  refund(order:Order){
    // return this.chain(backend.$order.save({action:this.oid,id:'refund'}).$promise);
  };

  // order can be canceled 
  // -> when user cancel an order reason is always cancel)
  // -> when admin cancel an order reason can be "customer", "fraud", "inventory", "system","timeout","other"
  // role: admin|user
  cancelWithReason(order:Order,reason:EnumCancelReason){
    // return this.chain(backend.$order.save({action:this.oid,id:'cancel'},{reason:reason}).$promise);
  };

  //
  // update item for one order (shop preparation process)
  // role:shop:admin
  updateItem(order:Order,item,fulfillment:EnumFulfillments){
    var tosave=Object.assign({},item), me=this;
    tosave.fulfillment.finalprice=parseFloat(item.fulfillment.finalprice);
    tosave.fulfillment.status=fulfillment;
    // this.chain(backend.$order.save({action:this.oid,id:'items'},[tosave]).$promise).$promise.then(function () {
    //   _.find(me.items,function(i){return i.sku===item.sku;}).fulfillment.status=fulfillment;
    // });
  };

  // update order with specific issue made by one shop
  // role:admin
  updateIssue(item,issue:EnumOrderIssue){
    let tosave=Object.assign({},item);
    tosave.fulfillment.issue=issue;
    // this.chain(backend.$order.save({action:this.oid,id:'issue'},[tosave]).$promise).$promise.then(function () {
    //   _.find(me.items,function(i){return i.sku===item.sku;}).fulfillment.issue=issue;
    // });
  };


  // update shipping status (TODO WTF !?)
  // role:logistic
  updateShipping(oid,status){
  };

  // update fee of shipping
  // role:admin
  updateShippingPrice(amount){
  };

  // validate shop products collect 
  // role:logistic
  updateCollect(shopname,status,when){
  };

  // find all orders by user
  // role:user
  findOrdersByUser(user){
  };

  // find all order filtered by filter
  // role:admin?
  findAllOrders(filter){
  };

  // find all order for one user shop
  // role:admin|shop
  findOrdersByShop(shop,filter){
    let params=Object.assign({},filter||{},{id:shop.urlpath,action:'shops'});
  };

  // find all repport 
  // role:admin|shop
  findRepportForShop(filter){
    let now=new Date();
    let params=Object.assign({},{month:now.getMonth()+1,year:now.getFullYear()},filter||{});
  };

}