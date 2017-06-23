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
const config_service_1 = require("./config.service");
class Category {
}
exports.Category = Category;
let CategoryService = class CategoryService {
    constructor(http, configSrv) {
        this.http = http;
        this.configSrv = configSrv;
        this.defaultCategory = {
            name: '',
            weight: 0,
            description: "",
            group: ""
        };
        this.config = configSrv.config;
        this.headers = new http_1.Headers();
        this.headers.append('Content-Type', 'application/json');
        this.config = configSrv.config;
    }
    updateCache(cat) {
        if (this.cache.map[cat.slug])
            return Object.assign(this.cache.map[cat.slug], cat);
    }
    deleteCache(cat) {
        if (this.cache.map[cat.slug]) {
            this.cache.map.delete(cat.slug);
            let index = this.cache.list.indexOf(cat);
            if (index > -1)
                this.cache.list.splice(index, 1);
        }
    }
    addCache(category) {
        if (!this.cache.map[category.slug]) {
            this.cache.map[category.slug] = category;
            this.cache.list.push(category);
            return;
        }
        return Object.assign(this.cache.map[category.slug], category);
    }
    getCurrent() {
        throw new Error("Not implemented");
    }
    ;
    findNameBySlug(slug) {
        throw new Error("Already implemented");
    }
    ;
    findBySlug(slug) {
        return this.cache.map[slug];
    }
    ;
    findByGroup(name) {
        return this.cache.list.filter(category => category.group === name);
    }
    select(filter) {
        filter = filter || {};
        return this.http.get(this.config.API_SERVER + '/v1/category', {
            search: filter,
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(categories => categories.map(category => this.addCache(category)));
    }
    get(slug) {
        let cached;
        if (this.cache.map[slug]) {
            return Rx_1.Observable.from(this.cache.map[slug]);
        }
        return this.http.get(this.config.API_SERVER + '/v1/category/' + slug, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(category => this.addCache(category))
            .catch(this.handleError);
    }
    save(slug, cat) {
        return this.http.post(this.config.API_SERVER + '/v1/category/' + slug, cat, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .catch(this.handleError);
    }
    create(cat) {
        return this.http.post(this.config.API_SERVER + '/v1/category/', cat, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json())
            .map(category => this.addCache(category))
            .catch(this.handleError);
    }
    remove(slug, password) {
        return this.http.put(this.config.API_SERVER + '/v1/category/' + slug, {
            headers: this.headers,
            withCredentials: true,
            password: password
        })
            .map(res => res.json())
            .map(cat => this.deleteCache(cat))
            .catch(this.handleError);
    }
    handleError(error) {
        let errMsg;
        if (error instanceof Response) {
            const body = error.json() || '';
            const err = JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        }
        else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return Rx_1.Observable.throw(errMsg);
    }
};
CategoryService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [http_1.Http,
        config_service_1.ConfigService])
], CategoryService);
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map