import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config.service';

import { Observable , of, ReplaySubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import {
  EnumCancelReason,
  EnumFulfillments,
  EnumOrderIssue
} from './order.enum';

import { Order, OrderItem, OrderShipping } from './order';
import { UserCard } from '../user.service';
import { CartItem } from '../cart.service';


export interface OrderCustomerInvoices {
  month:number;
  year:number;
  transfers:any[];
  paids:any[];
  invoices:any[];
}



@Injectable()
export class OrderService {

  public order$: ReplaySubject<Order>;
  public orders$ : ReplaySubject<Order[]>;


  private defaultOrder = {
    name: '',
    weight: 0,
    description: '',
    group: ''
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
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control' : 'no-cache',
      'Pragma' : 'no-cache',
      'ngsw-bypass':'true'
    });
    this.cache = {
      list: [], map: new Map()
    };

    this.order$ = new ReplaySubject(1);
    this.orders$ = new ReplaySubject<Order[]>();

  }


  //
  // common cache functions
  private cache: {
    list: Order[];
    map: Map<number, Order>; // key is a slug
  };

  private updateCache(order: Order) {
    //
    // avoid update cache on error
    if(order.errors) {
      return order;
    }
    if (!this.cache.map.has(order.oid)) {
      this.cache.map.set(order.oid, new Order(order));
      return this.cache.map.get(order.oid);
    }
    // FIXME check if new Order(...) is mandatory at this point ???
    const incache = this.cache.map.get(order.oid);
    incache.vendors = [] as any;
    incache.shipping = {} as any;
    incache.payment = {} as any;
    order.shipping.when = new Date(order.shipping.when);
    order.created = new Date(order.created);
    order.closed = order.closed?new Date(order.closed):undefined;

    //
    // update only modified items 
    incache.items.forEach(item =>  {
      const updated = order.items.find(elem => elem.sku == item.sku);
      if(!updated) {
        return;
      }
      Object.assign(item,updated);
    });
    order.items = incache.items;
    return Object.assign(incache, (order));
  }

  private deleteCache(order: Order) {
    const incache = this.cache.map[order.oid];
    if (this.cache.map[order.oid]) {
      delete this.cache.map[order.oid];
    }
    return incache;
  }



  //
  // customer order services
  customerInvoices():Observable<OrderCustomerInvoices[]> {
    return this.http.get<OrderCustomerInvoices[]>(this.config.API_SERVER + '/v1/orders/invoices', {
      headers: this.headers,
      withCredentials: true
    });

  }

  //
  // create a new order
  // role:client
  // app.post('/v1/orders', auth.ensureUserValid, orders.ensureValidAlias, queued(orders.create));
  create(hub: string, shipping: OrderShipping, items: CartItem[]|any[], payment: UserCard): Observable<Order> {
    // backend.$order.save({shipping:shipping,items:items,payment:payment}, function() {
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders', { hub, shipping, items, payment }, {
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
  informShopToOrders(shop: string, when: Date, message?: string): Observable<any> {
    shop = shop || 'shops'; // specified shop or all shops
    // return this.chain(backend.$order.inform({action:shop,id:'email'},{when:when,fulfillments:fulfillment}).$promise);
    return this.http.post<any>(this.config.API_SERVER + '/v1/orders/' + shop + '/email', { when, content: message }, {
      headers: this.headers,
      withCredentials: true
    });

  }

  // remove this order
  // role:admin only
  // TODO should be password protected
  // app.post('/v1/orders/:oid/remove', auth.ensureAdmin, orders.remove);
  remove(order: Order): Observable<any> {
    // return this.chain(backend.$order.save({action:this.oid,id:'remove'}).$promise);
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/remove', null, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.deleteCache(order))
    );
  }

  // capture this order
  // role:admin only
  // DEPRECATED opts => reason:'invoice'
  // app.post('/v1/orders/:oid/capture', auth.ensureAdmin, queued(orders.capture));
  capture(order: Order, opts?: any): Observable<any> {
    opts = opts || {};
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/capture', opts, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );
  }

  // refund an order item
  // role:admin or shop (when partial)
  // app.post('/v1/orders/:oid/refund', auth.ensureAdmin, queued(orders.refund));
  refund(order: Order, item: OrderItem): Observable<Order> {
    // return this.chain(backend.$order.save({action:this.oid,id:'refund'}).$promise);
    const params = Object.assign({}, item);
    params.finalprice = item.finalprice;
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/refund', params, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order))
    );
  }


  // refund an order HUB
  // role:admin or shop (when partial)
  // app.post('/v1/orders/:oid/hub/refund', auth.ensureAdmin, queued(orders.hub_refund));
  hub_refund(order: Order, amount: number): Observable<Order> {
    // return this.chain(backend.$order.save({action:this.oid,id:'refund'}).$promise);
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/hub/refund', { amount }, {
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
  // role:shop:operator:admin
  updateItem(order: Order, items, fulfillment: EnumFulfillments): Observable<Order> {
    const tosave = items.map(item => {
      const elem = Object.assign({}, item);
      elem.finalprice = parseFloat(item.finalprice);
      elem.fulfillment.status = EnumFulfillments[fulfillment];
      return elem;
    });

    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/items', tosave, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      // FIXME retryWhen dont throw Error after the 3 
      // retryWhen(errors => errors.pipe(delay(1000), take(3), concatMap(err => throwError(err)))),
      map(order => this.updateCache(order)),
      tap(order => this.order$.next(order))
    );
  }

  // update order with specific issue made by one shop
  // role:admin
  // app.post('/v1/orders/:oid/issue', auth.ensureAdmin, orders.updateIssue);
  updateIssue(order: Order, item, issue: EnumOrderIssue): Observable<Order> {
    const tosave = Object.assign({}, item);
    tosave.fulfillment.issue = EnumOrderIssue[issue];
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/issue', [tosave], {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order)),
      tap(order => this.order$.next(order))
    );
  }

  // update order with specific issue made by one shop
  // role:owner
  // app.post('/v1/orders/:oid/issue', auth.ensureAdmin, orders.updateIssue);
  requestIssue(order: Order, items, score: number, message?: string): Observable<any> {
    const tosave: any = {
      score,
      items: items.map(item => Object.assign({}, item))
    };
    //
    // specify a message
    if (message) {
      tosave.message = message;
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
    const status = order.shipping.shipped;
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { bags: value, status }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order)),
      tap(order => this.order$.next(order))
    );
  }


  // update shipping status (TODO WTF !?)
  // role:logistic
  // app.post('/v1/orders/:oid/shipping', auth.ensureLogisticOrAdmin, orders.updateShipping);
  updateShipping(order: Order, status) {
    // return this.chain(backend.$order.save({ action: oid, id: 'shipping' }, { amount: status }).$promise);
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { amount: status }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order)),
      tap(order => this.order$.next(order))
    );

  }

  // update shopper
  // role:logistic
  // app.post('/v1/orders/:oid/shipper', auth.ensureLogisticOrAdmin, orders.updateShippingShopper);
  updateShippingShopper(hub: string, shopper: string, priority: number, when: Date, time: string) {
    const params = {
      hub,
      shopper,
      priority,
      time,
      when
    };
    // return this.chain(backend.$order.save({ action: oid, id: 'shipping' }, { amount: status }).$promise);
    return this.http.post<Order[]>(this.config.API_SERVER + '/v1/orders/shopper', params, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(orders => orders.map(this.updateCache.bind(this)))
    );

  }

  // update shopper
  // role:logistic
  // app.post('/v1/orders/:oid/shipper', auth.ensureLogisticOrAdmin, orders.updateShippingShopper);
  updateShippingPriority(order: Order, priority: number, position: number) {
    const params = {
      priority,
      position,
    };
    // return this.chain(backend.$order.save({ action: oid, id: 'shipping' }, { amount: status }).$promise);
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/priority', params, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order)),
      tap(order => this.order$.next(order))
    );

  }

  // update fee of shipping
  // role:admin
  updateShippingPrice(order, amount) {
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { amount }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(order => this.updateCache(order)),
      tap(order => this.order$.next(order))
    );
  }

  updateInvoices(oids:number[], amount?: number){    
    return this.http.post<Order>(this.config.API_SERVER + '/v1/orders/invoices/update', {  oids, amount }, {
      headers: this.headers,
      withCredentials: true
    });
  }

  // validate shop products collect
  // role:logistic
  // app.post('/v1/orders/:shopname/collect', auth.ensureLogisticOrAdmin, orders.updateCollect);
  updateCollect(shopname, status, when, hub?): Observable<Order[]> {
    // return this.chain(backend.$order.collect({action:shopname,id:'collect'},{status:status,when:when}).$promise);
    return this.http.post<Order[]>(this.config.API_SERVER + '/v1/orders/' + shopname + '/collect', { status, when, hub }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(orders => orders.map(this.updateCache.bind(this)))
    );
  }


  // /v1/orders/prodcts?skus=111
  findProductsInPendingOrders(skus){
    return this.http.get<Order[]>(this.config.API_SERVER + '/v1/orders/products', {
      params: {skus},
      headers: this.headers,
      withCredentials: true
    }).pipe(catchError(err => of([])));    
  }

  // find all orders by user
  // role:user
  // app.get('/v1/orders/users/:id', users.ensureMeOrAdmin, orders.list);
  findOrdersByUser(user, filter?, _catchError?): Observable<Order[]> {
    // return this.chainAll(backend.$order.query({id:user.id,action:'users'}).$promise);
    return this.http.get<Order[]>(this.config.API_SERVER + '/v1/orders/users/' + user.id, {
      params: filter || {},
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(orders => orders.map(this.updateCache.bind(this)) as Order[]),
      catchError(err => {
        // FIXME, deprecated?s
        if(_catchError){
          return of([]);
        }
        return throwError(err)
      }),
      tap(orders => {
        this.orders$.next(orders);
      })
    );
  }

  // find all order filtered by filter
  // role:admin?
  findAllOrders(filter) {
    // return this.chainAll(backend.$order.query(filter).$promise);
    const self = this;
    return this.http.get<Order[]>(this.config.API_SERVER + '/v1/orders', {
      params: filter || {},
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(orders => orders.map(this.updateCache.bind(this)) as Order[]),
      tap(orders => {
        this.orders$.next(orders);
      })
    );
  }

  // find all order for one user shop
  // role:admin|shop
  // app.get('/v1/orders/shops/:shopname', shops.ensureOwnerOrAdmin, orders.listByShop);
  findOrdersByShop(shop, filter): Observable<Order[]> {
    shop = (shop) ? ('/' + shop.urlpath) : '';
    return this.http.get<Order[]>(this.config.API_SERVER + '/v1/orders/shops' + shop, {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(orders => orders.map(this.updateCache.bind(this)))
    );
  }

  // find all repport
  // role:admin:operator:shop
  findRepportForShop(filter): Observable<any> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    // let params = Object.assign({}, { month: now.getMonth() + 1, year: now.getFullYear() }, filter || {});
    return this.http.get<Order[]>(this.config.API_SERVER + '/v1/orders/invoices/shops/' + month + '/' + year, {
      params: filter,
      headers: this.headers,
      withCredentials: true
    });
  }

}
