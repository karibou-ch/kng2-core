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
require("rxjs/add/observable/from");
const moment = require("moment");
require("moment/locale/fr");
const config_service_1 = require("./config.service");
class Shop {
    constructor() { }
}
exports.Shop = Shop;
;
class User {
    constructor() {
        this.id = '';
        this.displayName = '';
        this.name = {
            givenName: '',
            familyName: '',
        };
        this.birthday = new Date();
        this.gender = '';
        this.tags = [];
        this.url = '';
        this.email = {
            address: '',
            cc: '',
            status: ''
        };
        this.reminder = {
            active: false,
            weekdays: [],
            time: null
        };
        this.roles = [];
        this.shops = [];
        this.provider = '';
        this.url = '';
        this.phoneNumbers = [{
                number: '',
                what: 'mobile'
            }];
        this.photo = '';
        this.addresses = [{
                name: '',
                note: '',
                floor: '',
                streetAdress: '',
                region: '',
                postalCode: '',
                primary: false,
                geo: {
                    lat: null,
                    lng: null
                }
            }];
        this.logistic = {
            postalCode: ''
        };
    }
    display() {
        if (this.displayName) {
            return this.displayName;
        }
        if (this.name && (this.name.givenName || this.name.familyName)) {
            return this.name.givenName + ' ' + this.name.familyName;
        }
        if (this.id) {
            return this.id + '@' + this.provider;
        }
        return 'Anonymous';
    }
    loggedTime() {
        return (Date.now() - (new Date(this.logged)).getTime()) / 1000;
    }
    isOwner(shopname) {
        for (var i in this.shops) {
            if (this.shops[i].name === shopname) {
                return true;
            }
        }
        return false;
    }
    isOwnerOrAdmin(shopname) {
        if (this.isAdmin())
            return true;
        return this.isOwner(shopname);
    }
    isAuthenticated() {
        return this.id !== '';
    }
    isAdmin() {
        return this.hasRole('admin');
    }
    isReady() {
        return (this.email && this.email.status === true);
    }
    hasRole(role) {
        for (var i in this.roles) {
            if (this.roles[i] === role)
                return true;
        }
        return false;
    }
    hasLike(product) {
        if (this.likes && this.likes.length) {
            if (this.likes.indexOf(product.sku) !== -1) {
                return true;
            }
        }
        return false;
    }
    hasPrimaryAddress() {
        if (this.addresses && this.addresses.length == 1)
            return 0;
        for (var i in this.addresses) {
            if (this.addresses[i].primary === true)
                return i;
        }
        return false;
    }
    getEmailStatus() {
        if (!this.email || !this.email.status)
            return false;
        if (this.email.status === true)
            return true;
        return moment(this.email.status).format('ddd DD MMM YYYY');
    }
    populateAdresseName() {
        if (this.addresses && this.addresses.length && !this.addresses[0].name) {
            this.addresses[0].name = this.name.familyName + ' ' + this.name.givenName;
        }
    }
    getBVR() {
        var self = this;
    }
    init() {
        var self = this;
        if (!self.addresses) {
            return;
        }
        self.populateAdresseName();
        self.addresses.forEach(function (address, i) {
            if (!address.geo || !address.geo.lat || !address.geo.lng) {
                return;
            }
        });
    }
}
exports.User = User;
let UserService = class UserService {
    constructor(configSrv, http) {
        this.configSrv = configSrv;
        this.http = http;
        this.defaultUser = new User();
        this.currentUser = new User();
        this.cache = {
            list: [],
            map: new Map()
        };
        this.config = configSrv.defaultConfig;
        this.headers = new http_1.Headers();
        this.headers.append('Content-Type', 'application/json');
        Object.assign(this.currentUser, this.defaultUser);
        this.user$ = new Rx_1.ReplaySubject(1);
    }
    deleteCache(user) {
        if (this.cache.map[user.id]) {
            this.cache.map.delete(user.id);
            let index = this.cache.list.indexOf(user);
            if (index > -1)
                this.cache.list.splice(index, 1);
        }
    }
    updateCache(user) {
        this.user$.next(user);
        Object.assign(this.currentUser, user);
        if (!this.cache.map[user.id]) {
            this.cache.map[user.id] = user;
            this.cache.list.push(user);
            return user;
        }
        return Object.assign(this.cache.map[user.id], user);
    }
    get(id) {
        if (this.cache.map[id]) {
            return Rx_1.Observable.from(this.cache.map[id]);
        }
        return this.http.get(this.config.API_SERVER + '/v1/users/' + id, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(user => this.updateCache(user))
            .catch(err => Rx_1.Observable.of(this.defaultUser));
    }
    me() {
        return this.http.get(this.config.API_SERVER + '/v1/users/me', {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .catch(err => Rx_1.Observable.of(this.defaultUser))
            .map(user => this.updateCache(user))
            .flatMap(() => this.user$.asObservable());
    }
    query(filter) {
        filter = filter || {};
        return this.http.get(this.config.API_SERVER + '/v1/users/', {
            search: filter,
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(users => users.map(user => this.updateCache(user)));
    }
    validate(id, email) {
        return this.http.get(this.config.API_SERVER + '/v1/validate/' + id + '/' + email, {
            headers: this.headers,
            withCredentials: true
        });
    }
    validateEmail(email) {
        return this.http.post(this.config.API_SERVER + '/v1/validate/create', email, {
            headers: this.headers,
            withCredentials: true
        });
    }
    recover(token, email, recover) {
        return this.http.post(this.config.API_SERVER + '/v1/recover/' + token + '/' + email + '/password', recover, {
            headers: this.headers,
            withCredentials: true
        });
    }
    save(user) {
        user.populateAdresseName();
        return this.http.post(this.config.API_SERVER + '/v1/users/' + user.id, user, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .catch(err => Rx_1.Observable.of(this.defaultUser));
    }
    logout() {
        return this.http.get(this.config.API_SERVER + '/logout/', {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => this.defaultUser)
            .catch(err => Rx_1.Observable.of(this.defaultUser))
            .map(user => this.updateCache(user));
    }
    register(user) {
        user.populateAdresseName();
        return this.http.post(this.config.API_SERVER + '/register', user, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(user => this.updateCache(user))
            .catch(err => Rx_1.Observable.of(this.defaultUser));
    }
    ;
    newpassword(id, change) {
        return this.http.post(this.config.API_SERVER + '/v1/users/' + id + '/password', change, {
            headers: this.headers,
            withCredentials: true
        });
    }
    ;
    login(data) {
        return this.http.post(this.config.API_SERVER + '/login', data, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .catch(err => Rx_1.Observable.of(this.defaultUser))
            .map(user => this.updateCache(user));
    }
    ;
    createShop(shop) {
        return this.http.post(this.config.API_SERVER + '/v1/shops', shop, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json);
    }
    ;
    remove(id, password) {
        return this.http.put(this.config.API_SERVER + '/v1/users/', { password: password }, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(user => this.deleteCache(user));
    }
    ;
    love(id, product) {
        return this.http.post(this.config.API_SERVER + '/v1/users/' + id + '/like/' + product.sku, null, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(user => {
            this.cache.list.find(u => u.id === user.id).likes = user.likes.slice();
            this.cache.map.get(user.id).likes = user.likes.slice();
        })
            .catch(err => Rx_1.Observable.of(this.defaultUser));
    }
    ;
    geocode(street, postal, region) {
        if (!region)
            region = "Suisse";
        var fulladdress = street + "," + postal + ", " + region;
        var url = "//maps.googleapis.com/maps/api/geocode/json?address=" + fulladdress + "&sensor=false";
        return this.http.get(url, { withCredentials: false })
            .map(res => res.json());
    }
    updateGeoCode(user) {
        let obs = [], self = this;
        if ("obj" in user) {
            return;
        }
        if (user.addresses.length === 0 || user.addresses.length && user.addresses[0].geo && user.addresses[0].geo.lat) {
            return;
        }
        if (!user.addresses[0].geo)
            user.addresses[0].geo = { lat: null, lng: null };
        user.addresses.forEach((address, i) => {
            obs.push(this.geocode(address.streetAdress, address.postalCode, address.region)
                .map(geo => {
                if (!geo.results.length || !geo.results[0].geometry) {
                    return;
                }
                if (!geo.results[0].geometry.lat) {
                    return;
                }
                address.geo = { lat: null, lng: null };
                address.geo.lat = geo.results[0].geometry.location.lat;
                address.geo.lng = geo.results[0].geometry.location.lng;
            }));
        });
        return Rx_1.Observable.from(obs);
    }
    checkPaymentMethod(user) {
        let allAlias = user.payments.map(payment => { return payment.alias; });
        let alias = allAlias.pop();
        return this.http.post(this.config.API_SERVER + '/v1/users/' + user.id + '/payment/' + alias + '/check', allAlias, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(user => this.updateCache(user))
            .catch(err => Rx_1.Observable.of(this.defaultUser));
        ;
    }
    addPaymentMethod(payment, uid) {
        return this.http.post(this.config.API_SERVER + '/v1/users/' + uid + '/payment', payment, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(user => this.updateCache(user))
            .catch(err => Rx_1.Observable.of(this.defaultUser));
    }
    deletePaymentMethod(alias, uid) {
        return this.http.post(this.config.API_SERVER + '/v1/users/' + uid + '/payment/' + alias + '/delete', null, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(user => this.updateCache(user))
            .catch(err => Rx_1.Observable.of(this.defaultUser));
    }
    updateStatus(id, status) {
        return this.http.post(this.config.API_SERVER + '/v1/users/' + id + '/status', { status: status }, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(user => this.updateCache(user))
            .catch(err => Rx_1.Observable.of(this.defaultUser));
    }
};
UserService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        http_1.Http])
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map