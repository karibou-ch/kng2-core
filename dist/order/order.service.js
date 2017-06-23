"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("@angular/http");
const core_1 = require("@angular/core");
const Rx_1 = require("rxjs/Rx");
const config_service_1 = require("../config.service");
let OrderService = class OrderService {
    constructor(http, configSrv) {
        this.http = http;
        this.configSrv = configSrv;
        this.defaultOrder = {
            name: '',
            weight: 0,
            description: "",
            group: ""
        };
        this.config = configSrv.defaultConfig;
        this.headers = new http_1.Headers();
        this.headers.append('Content-Type', 'application/json');
    }
    updateCache(order) {
        if (this.cache.map[order.oid])
            return Object.assign(this.cache.map[order.oid], order);
    }
    deleteCache(order) {
        if (this.cache.map[order.oid]) {
            let index = this.cache.list.indexOf(order);
            if (index > -1)
                this.cache.list.splice(index, 1);
            delete this.cache.map[order.oid];
        }
    }
    addCache(order) {
        if (!this.cache.map[order.oid]) {
            this.cache.map[order.oid] = order;
            this.cache.list.push(order);
            return order;
        }
        return Object.assign(this.cache.map[order.oid], order);
    }
    create(shipping, items, payment) {
        return this.http.post(this.config.API_SERVER + '/v1/orders', { shipping: shipping, items: items, payment: payment }, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .catch(err => Rx_1.Observable.of(this.defaultOrder));
    }
    informShopToOrders(shop, when, fulfillment) {
        shop = shop || 'shops';
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + shop + '/email', { when: when, fulfillments: fulfillment }, {
            headers: this.headers,
            withCredentials: true
        });
    }
    updateBagsCount(order, value) {
        var status = order.shipping.shipped;
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { bags: value, status: status }, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(order => this.updateCache(order))
            .catch(err => Rx_1.Observable.of(this.defaultOrder));
    }
    remove(order) {
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/remove', null, {
            headers: this.headers,
            withCredentials: true
        });
    }
    capture(order, opts) {
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/capture', opts, {
            headers: this.headers,
            withCredentials: true
        });
    }
    refund(order) {
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/refund', null, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .catch(err => Rx_1.Observable.of(this.defaultOrder));
    }
    cancelWithReason(order, reason) {
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/cancel', { reason: reason }, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .catch(err => Rx_1.Observable.of(this.defaultOrder));
    }
    ;
    updateItem(order, item, fulfillment) {
        var tosave = Object.assign({}, item);
        tosave.fulfillment.finalprice = parseFloat(item.fulfillment.finalprice);
        tosave.fulfillment.status = fulfillment;
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/items', [tosave], {
            headers: this.headers,
            withCredentials: true
        })
            .map((res) => {
            order.items.find(i => i.sku === item.sku).fulfillment.status = fulfillment;
            return res;
        })
            .map(res => res.json())
            .catch(err => Rx_1.Observable.of(this.defaultOrder));
    }
    ;
    updateIssue(order, item, issue) {
        let tosave = Object.assign({}, item);
        tosave.fulfillment.issue = issue;
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/issue', [tosave], {
            headers: this.headers,
            withCredentials: true
        })
            .map((res) => {
            order.items.find(i => i.sku === item.sku).fulfillment.issue = issue;
            return res;
        })
            .map(res => res.json())
            .catch(err => Rx_1.Observable.of(this.defaultOrder));
    }
    updateShipping(order, oid, status) {
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { amount: status }, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .catch(err => Rx_1.Observable.of(this.defaultOrder));
    }
    updateShippingPrice(order, amount) {
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + order.oid + '/shipping', { amount: amount }, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .catch(err => Rx_1.Observable.of(this.defaultOrder));
    }
    ;
    updateCollect(shopname, status, when) {
        return this.http.post(this.config.API_SERVER + '/v1/orders/' + shopname + '/collect', { status: status, when: when }, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json());
    }
    findOrdersByUser(user) {
        return this.http.get(this.config.API_SERVER + '/v1/orders/users/' + user.id, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json());
    }
    findAllOrders(filter) {
        return this.http.get(this.config.API_SERVER + '/v1/orders', {
            params: filter,
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json());
    }
    findOrdersByShop(shop, filter) {
        return this.http.get('/v1/orders/shops/' + shop.urlpath, {
            params: filter,
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json());
    }
    findRepportForShop(filter) {
        let now = new Date();
        let month = now.getMonth() + 1;
        let year = now.getFullYear();
        return this.http.get('/v1/orders/invoices/shops/' + month + '/' + year, {
            search: filter,
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json());
    }
};
OrderService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [http_1.Http,
        config_service_1.ConfigService])
], OrderService);
exports.OrderService = OrderService;
//# sourceMappingURL=order.service.js.map