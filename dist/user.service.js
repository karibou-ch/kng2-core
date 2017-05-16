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
const moment = require("moment");
require("moment/locale/fr");
const config_service_1 = require("./config.service");
class Shop {
    constructor() { }
}
exports.Shop = Shop;
;
class User {
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
    populateAdresseName(user) {
        if (!user)
            user = this;
        if (user.addresses && user.addresses.length && !user.addresses[0].name) {
            user.addresses[0].name = user.name.familyName + ' ' + user.name.givenName;
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
    constructor(config, http) {
        this.config = config;
        this.http = http;
        this.defaultUser = {
            id: '',
            name: {
                givenName: '',
                familyName: '',
            },
            email: {},
            reminder: { weekdays: [] },
            roles: [],
            shops: [],
            provider: '',
            url: '',
            phoneNumbers: [{ what: 'mobile' }],
            addresses: [],
            logistic: {
                postalCode: []
            }
        };
        this.headers = new http_1.Headers();
        this.headers.append('Content-Type', 'application/json');
    }
    ge(id) {
        return this.http.get(this.config.API_SERVER + '/v1/users/:id/:action/:aid/:detail', { headers: this.headers })
            .map(res => res.json()).publishLast().refCount();
    }
    me(cb) {
        var self = this;
    }
};
UserService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        http_1.Http])
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map