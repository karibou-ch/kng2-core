import { Http, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
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
  config: any;
  headers: Headers;

  constructor(
    private http: Http,
    private configSrv: ConfigService
  ) {
    //
    // TODO wait for observale!
    this.config = ConfigService.defaultConfig;
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
    this.cache={
      list:[],map:new Map()
    };
  }


  //
  // common cache functions
  private cache: {
    list: Order[];
    map: Map<number, Order>; //key is a slug
  }

  private updateCache(order: Order) {
    if(!this.cache.map[order.oid]){
      this.cache.map.set(order.oid,new Order(order))
      return this.cache.map.get(order.oid);
    }
    return Object.assign(this.cache.map[order.oid], order);
  }

  private deleteCache(order: Order) {
    let incache=this.cache.map[order.oid];
    if (this.cache.map[order.oid]) {
      delete this.cache.map[order.oid];
    }
    return incache;
  }



  //
  // common order services
  // TODO should be splited on differents services and classes

  //
  // create a new order
  // role:client
  // app.post('/v1/orders', auth.ensureUserValid, orders.ensureValidAlias, queued(orders.create));
  create(shipping, items, payment): Observable<Order> {
    //backend.$order.save({shipping:shipping,items:items,payment:payment}, function() {
    return this.http.post(this.config.API_SERVER + '/v1/orders', { shipping: shipping, items: items, payment: payment }, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()));
  }

  //
  // mail [all|specified] vendors for orders
  // role:admin|shop
  // app.post('/v1/orders/:shopname/email',shops.ensureOwnerOrAdmin,orders.informShopToOrders);
  informShopToOrders(shop: string, when: Date, fulfillment: EnumFulfillments): Observable<any> {
    shop = shop || 'shops'; // specified shop or all shops
    //return this.chain(backend.$order.inform({action:shop,id:'email'},{when:when,fulfillments:fulfillment}).$promise);
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + shop + '/email', { when: when, fulfillments: EnumFulfillments[fulfillment] }, {
      headers: this.headers,
      withCredentials: true
    })

  }

  // remove this order
  // role:admin only
  // TODO should be password protected
  // app.post('/v1/orders/:oid/remove', auth.ensureAdmin, orders.remove);
  remove(order: Order): Observable<any> {
    //return this.chain(backend.$order.save({action:this.oid,id:'remove'}).$promise);
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/remove', null, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.deleteCache(order));
  }

  // capture this order
  // role:admin only
  // TODO opts ??
  // app.post('/v1/orders/:oid/capture', auth.ensureAdmin, queued(orders.capture));
  capture(order: Order, opts): Observable<any> {
    // opts=opts||{};
    // return this.chain(backend.$order.save({action:this.oid,id:'capture'},opts).$promise);
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/capture', opts, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()));
  }

  // refund an order
  // role:admin or shop (when partial)
  // app.post('/v1/orders/:oid/refund', auth.ensureAdmin, queued(orders.refund));
  refund(order: Order): Observable<Order> {
    // return this.chain(backend.$order.save({action:this.oid,id:'refund'}).$promise);
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/refund', null, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()));
  }

  // order can be canceled
  // -> when user cancel an order reason is always cancel)
  // -> when admin cancel an order reason can be "customer", "fraud", "inventory", "system","timeout","other"
  // role: admin|user
  // app.post('/v1/orders/:oid/cancel', orders.ensureOwnerOrAdmin, queued(orders.cancel));
  cancelWithReason(order: Order, reason: EnumCancelReason): Observable<Order> {
    // return this.chain(backend.$order.save({action:this.oid,id:'cancel'},{reason:reason}).$promise);
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/cancel', { reason: reason }, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()));
  };

  //
  // update item for one order (shop preparation process)
  // role:shop:admin
  // app.post('/v1/orders/:oid/items', orders.ensureShopOwnerOrAdmin, queued(orders.updateItem));
  updateItem(order: Order, item, fulfillment: EnumFulfillments): Observable<Order> {
    let tosave = Object.assign({}, item);
    tosave.finalprice = parseFloat(item.finalprice);
    tosave.fulfillment.status = EnumFulfillments[fulfillment];
    // this.chain(backend.$order.save({action:this.oid,id:'items'},[tosave]).$promise).$promise.then(function () {
    //   _.find(me.items,function(i){return i.sku===item.sku;}).fulfillment.status=fulfillment;
    // });
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/items', [tosave], {
      headers: this.headers,
      withCredentials: true
    })
      // .map((res) => {
      //   let item:any=order.items.find(i => i.sku === item.sku);
      //   item.fulfillment.status = EnumFulfillments[fulfillment];
      //   return res;
      // })
      .map(res => this.updateCache(res.json()));
  };

  // update order with specific issue made by one shop
  // role:admin
  // app.post('/v1/orders/:oid/issue', auth.ensureAdmin, orders.updateIssue);
  updateIssue(order: Order, item, issue: EnumOrderIssue): Observable<Order> {
    let tosave = Object.assign({}, item);
    tosave.fulfillment.issue = issue;
    // this.chain(backend.$order.save({action:this.oid,id:'issue'},[tosave]).$promise).$promise.then(function () {
    //   _.find(me.items,function(i){return i.sku===item.sku;}).fulfillment.issue=issue;
    // });
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/issue', [tosave], {
      headers: this.headers,
      withCredentials: true
    })
      // .map((res) => {
      //   order.items.find(i => i.sku === item.sku).fulfillment.issue = issue;
      //   return res;
      // })
      .map(res => this.updateCache(res.json()));
  }

  // update effective bags for this order
  // role:logistic
  // app.post('/v1/orders/:oid/shipping', auth.ensureLogisticOrAdmin, orders.updateShipping);
  updateBagsCount(order: Order, value: number): Observable<Order> {
    var status = order.shipping.shipped;
    //return this.chain(backend.$order.save({action:this.oid,id:'shipping'},{bags:value,status:status}).$promise);
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { bags: value, status: status }, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()));
  }


  // update shipping status (TODO WTF !?)
  // role:logistic
  // app.post('/v1/orders/:oid/shipping', auth.ensureLogisticOrAdmin, orders.updateShipping);
  updateShipping(order: Order, status) {
    //return this.chain(backend.$order.save({ action: oid, id: 'shipping' }, { amount: status }).$promise);
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { amount: status }, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()));

  }

  // update shopper  
  // role:logistic
  // app.post('/v1/orders/:oid/shipper', auth.ensureLogisticOrAdmin, orders.updateShippingShopper);
  updateShippingShopper(order: Order,priority:number,position:number) {
    let params={
      priority:priority,
      position:position
    };
    //return this.chain(backend.$order.save({ action: oid, id: 'shipping' }, { amount: status }).$promise);
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shopper', params, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()));

  }


  // update fee of shipping
  // role:admin
  updateShippingPrice(order, amount) {
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { amount: amount }, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()));
  };

  // validate shop products collect
  // role:logistic
  // app.post('/v1/orders/:shopname/collect', auth.ensureLogisticOrAdmin, orders.updateCollect);
  updateCollect(shopname, status, when): Observable<Order[]> {
    //return this.chain(backend.$order.collect({action:shopname,id:'collect'},{status:status,when:when}).$promise);
    return this.http.post(this.config.API_SERVER + '/v1/orders/' + shopname + '/collect', { status: status, when: when }, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json().map(this.updateCache.bind(this)));
  }

  // find all orders by user
  // role:user
  // app.get('/v1/orders/users/:id', users.ensureMeOrAdmin, orders.list);
  findOrdersByUser(user): Observable<Order[]> {
    //return this.chainAll(backend.$order.query({id:user.id,action:'users'}).$promise);
    return this.http.get(this.config.API_SERVER + '/v1/orders/users/' + user.id, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json().map(this.updateCache.bind(this)));
  }

  // find all order filtered by filter
  // role:admin?
  findAllOrders(filter) {
    //return this.chainAll(backend.$order.query(filter).$promise);
    let self=this;
    return this.http.get(this.config.API_SERVER + '/v1/orders', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json().map(this.updateCache.bind(this)));
//      .map(res => res.json().map(this.updateCache.bind(this)));
      //.map(orders => orders.map(order => this.updateCache(order)));
  }

  // find all order for one user shop
  // role:admin|shop
  // app.get('/v1/orders/shops/:shopname', shops.ensureOwnerOrAdmin, orders.listByShop);
  findOrdersByShop(shop, filter): Observable<Order[]> {
    //let params = Object.assign({}, filter || {}, { id: shop.urlpath, action: 'shops' });
    //return this.chainAll(backend.$order.query(params).$promise);
    return this.http.get('/v1/orders/shops/'+shop.urlpath,{
      params: filter,
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json().map(this.updateCache.bind(this)));
      //.map(orders => orders.map(order => this.updateCache(order)));
  }

  // find all repport
  // role:admin|shop
  // app.get('/v1/orders/invoices/shops/:month/:year?', orders.ensureHasShopOrAdmin, orders.invoicesByShops);
  findRepportForShop(filter):Observable<any> {
    let now = new Date();
    let month = now.getMonth() + 1;
    let year = now.getFullYear()
    //let params = Object.assign({}, { month: now.getMonth() + 1, year: now.getFullYear() }, filter || {});
    return this.http.get('/v1/orders/invoices/shops/'+ month +'/'+year, {
      search: filter,
      headers: this.headers,
      withCredentials: true
    })
    .map(res => res.json());
  }

}
