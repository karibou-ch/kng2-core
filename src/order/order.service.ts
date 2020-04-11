import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config.service'

import { Observable ,  of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  EnumCancelReason,
  EnumFinancialStatus,
  EnumFulfillments,
  EnumOrderIssue,
  EnumShippingMode
} from './order.enum';

import { Order, OrderItem, OrderShipping } from './order';
import { UserCard, UserAddress } from '../user.service';
import { CartItem } from '../cart.service';


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
  headers: HttpHeaders;

  constructor(
    private http: HttpClient,
    private configSrv: ConfigService
  ) {
    //
    // TODO wait for observale!
    this.config = ConfigService.defaultConfig;
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.headers.append('Cache-Control' , 'no-cache');
    this.headers.append('Pragma' , 'no-cache');
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
    return Object.assign(this.cache.map[order.oid], new Order(order));
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
  create(shipping:OrderShipping, items:CartItem[]|any[], payment:UserCard): Observable<Order> {
    //backend.$order.save({shipping:shipping,items:items,payment:payment}, function() {
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders', { shipping: shipping, items: items, payment: payment }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );
  }

  //
  // mail [all|specified] vendors for orders
  // role:admin|shop
  // app.post('/v1/orders/:shopname/email',shops.ensureOwnerOrAdmin,orders.informShopToOrders);
  // app.post('/v1/orders/shops/email',shops.ensureAuthenticated,orders.informShopToOrders);
  informShopToOrders(shop: string, when: Date, message?:string): Observable<any> {
    shop = shop || 'shops'; // specified shop or all shops
    //return this.chain(backend.$order.inform({action:shop,id:'email'},{when:when,fulfillments:fulfillment}).$promise);
    return this.http.post<any>(this.config.API_SERVER + '/v1/orders/' + shop + '/email', { when: when, content: message }, {
      headers: this.headers,
      withCredentials: true
    });

  }

  // remove this order
  // role:admin only
  // TODO should be password protected
  // app.post('/v1/orders/:oid/remove', auth.ensureAdmin, orders.remove);
  remove(order: Order): Observable<any> {
    //return this.chain(backend.$order.save({action:this.oid,id:'remove'}).$promise);
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/remove', null, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.deleteCache(order))
    );
  }

  // capture this order
  // role:admin only
  // TODO opts => reason:'invoice'
  // app.post('/v1/orders/:oid/capture', auth.ensureAdmin, queued(orders.capture));
  capture(order: Order, opts?:any): Observable<any> {
    opts=opts||{};
    // return this.chain(backend.$order.save({action:this.oid,id:'capture'},opts).$promise);
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/capture',opts, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );
  }

  // refund an order item
  // role:admin or shop (when partial)
  // app.post('/v1/orders/:oid/refund', auth.ensureAdmin, queued(orders.refund));
  refund(order: Order, item:OrderItem): Observable<Order> {
    // return this.chain(backend.$order.save({action:this.oid,id:'refund'}).$promise);
    let params = Object.assign({}, item);
    params.finalprice = item.finalprice;
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/refund', params, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );
  }

  // order can be canceled
  // -> when user cancel an order reason is always cancel)
  // -> when admin cancel an order reason can be "customer", "fraud", "inventory", "system","timeout","other"
  // role: admin|user
  // app.post('/v1/orders/:oid/cancel', orders.ensureOwnerOrAdmin, queued(orders.cancel));
  cancelWithReason(order: Order, reason: EnumCancelReason): Observable<Order> {
    // return this.chain(backend.$order.save({action:this.oid,id:'cancel'},{reason:reason}).$promise);
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/cancel', { reason: EnumCancelReason[reason] }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );
  }

  //
  // update item for one order (shop preparation process)
  // role:shop:admin
  // app.post('/v1/orders/:oid/items', orders.ensureShopOwnerOrAdmin, queued(orders.updateItem));
  updateItem(order: Order, items, fulfillment: EnumFulfillments): Observable<Order> {

    const tosave = items.map(item => {
      const elem = Object.assign({}, item);
      elem.finalprice = parseFloat(item.finalprice);
      elem.fulfillment.status = EnumFulfillments[fulfillment];
    });

    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/items', tosave, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );
  }

  // update order with specific issue made by one shop
  // role:admin
  // app.post('/v1/orders/:oid/issue', auth.ensureAdmin, orders.updateIssue);
  updateIssue(order: Order, item, issue: EnumOrderIssue): Observable<Order> {
    let tosave = Object.assign({}, item);
    tosave.fulfillment.issue = EnumOrderIssue[issue];
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/issue', [tosave], {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );
  }

  // update order with specific issue made by one shop
  // role:owner
  // app.post('/v1/orders/:oid/issue', auth.ensureAdmin, orders.updateIssue);
  requestIssue(order: Order,items,score:number,message?:string): Observable<any> {
    let tosave:any = {
      score:score,
      items:items.map(item=>Object.assign({},item))
    };
    //
    // specify a message
    if(message){
      tosave.message=message;
    }
    return this.http.post<any>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/issue/request', tosave, {
      headers: this.headers,
      withCredentials: true
    });
  }
  
  // update effective bags for this order
  // role:logistic
  // app.post('/v1/orders/:oid/shipping', auth.ensureLogisticOrAdmin, orders.updateShipping);
  updateBagsCount(order: Order, value: number): Observable<Order> {
    var status = order.shipping.shipped;
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { bags: value, status: status }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );
  }


  // update shipping status (TODO WTF !?)
  // role:logistic
  // app.post('/v1/orders/:oid/shipping', auth.ensureLogisticOrAdmin, orders.updateShipping);
  updateShipping(order: Order, status) {
    //return this.chain(backend.$order.save({ action: oid, id: 'shipping' }, { amount: status }).$promise);
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { amount: status }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );

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
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shopper', params, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );

  }


  // update fee of shipping
  // role:admin
  updateShippingPrice(order, amount) {
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { amount: amount }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );
  };

  // validate shop products collect
  // role:logistic
  // app.post('/v1/orders/:shopname/collect', auth.ensureLogisticOrAdmin, orders.updateCollect);
  updateCollect(shopname, status, when): Observable<Order[]> {
    //return this.chain(backend.$order.collect({action:shopname,id:'collect'},{status:status,when:when}).$promise);
    return this.http.post<Order[]>(this.config.API_SERVER + '/v1/orders/' + shopname + '/collect', { status: status, when: when }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(orders => orders.map(this.updateCache.bind(this)))
    );
  }

  // find all orders by user
  // role:user
  // app.get('/v1/orders/users/:id', users.ensureMeOrAdmin, orders.list);
  findOrdersByUser(user,filter?): Observable<Order[]> {
    //return this.chainAll(backend.$order.query({id:user.id,action:'users'}).$promise);
    return this.http.get<Order[]>(this.config.API_SERVER + '/v1/orders/users/' + user.id, {
      params:filter||{},
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(orders => orders.map(this.updateCache.bind(this)))
    );
  }

  // find all order filtered by filter
  // role:admin?
  findAllOrders(filter) {
    //return this.chainAll(backend.$order.query(filter).$promise);
    let self=this;
    return this.http.get<Order[]>(this.config.API_SERVER + '/v1/orders', {
      params: filter||{},
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(orders => orders.map(this.updateCache.bind(this)))
    );
  }

  // find all order for one user shop
  // role:admin|shop
  // app.get('/v1/orders/shops/:shopname', shops.ensureOwnerOrAdmin, orders.listByShop);
  findOrdersByShop(shop, filter): Observable<Order[]> {
    shop=(shop)?('/'+shop.urlpath):'';
    return this.http.get<Order[]>(this.config.API_SERVER +'/v1/orders/shops'+shop,{
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(orders => orders.map(this.updateCache.bind(this)))
    );
  }

  // find all repport
  // role:admin|shop
  // app.get('/v1/orders/invoices/shops/:month/:year?', orders.ensureHasShopOrAdmin, orders.invoicesByShops);
  findRepportForShop(filter):Observable<any> {
    let now = new Date();
    let month = now.getMonth() + 1;
    let year = now.getFullYear()
    //let params = Object.assign({}, { month: now.getMonth() + 1, year: now.getFullYear() }, filter || {});
    return this.http.get<Order[]>(this.config.API_SERVER +'/v1/orders/invoices/shops/'+ month +'/'+year, {
      params: filter,
      headers: this.headers,
      withCredentials: true
    });    
  }

}
