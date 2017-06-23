import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { ConfigService } from '../config.service';
import { EnumCancelReason, EnumFulfillments, EnumOrderIssue } from './order.enum';
import { Order } from './order';
export declare class OrderService {
    private http;
    private configSrv;
    private defaultOrder;
    config: any;
    headers: Headers;
    constructor(http: Http, configSrv: ConfigService);
    private cache;
    private updateCache(order);
    private deleteCache(order);
    private addCache(order);
    create(shipping: any, items: any, payment: any): Observable<Order>;
    informShopToOrders(shop: string, when: Date, fulfillment: EnumFulfillments): Observable<any>;
    updateBagsCount(order: Order, value: number): Observable<Order>;
    remove(order: Order): Observable<any>;
    capture(order: Order, opts: any): Observable<any>;
    refund(order: Order): Observable<Order>;
    cancelWithReason(order: Order, reason: EnumCancelReason): Observable<Order>;
    updateItem(order: Order, item: any, fulfillment: EnumFulfillments): Observable<Order>;
    updateIssue(order: Order, item: any, issue: EnumOrderIssue): Observable<Order>;
    updateShipping(order: Order, oid: any, status: any): Observable<Order | {
        name: string;
        weight: number;
        description: string;
        group: string;
    }>;
    updateShippingPrice(order: any, amount: any): Observable<Order | {
        name: string;
        weight: number;
        description: string;
        group: string;
    }>;
    updateCollect(shopname: any, status: any, when: any): Observable<Order[]>;
    findOrdersByUser(user: any): Observable<Order[]>;
    findAllOrders(filter: any): Observable<Order[]>;
    findOrdersByShop(shop: any, filter: any): Observable<Order[]>;
    findRepportForShop(filter: any): Observable<any>;
}
