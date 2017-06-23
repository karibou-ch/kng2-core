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
const core_1 = require("@angular/core");
const http_1 = require("@angular/http");
const Observable_1 = require("rxjs/Observable");
require("rxjs/Rx");
const config_service_1 = require("./config.service");
const user_service_1 = require("./user.service");
const category_service_1 = require("./category.service");
let LoaderService = class LoaderService {
    constructor(http, configSrv, userSrv, categorySrv) {
        this.http = http;
        this.configSrv = configSrv;
        this.userSrv = userSrv;
        this.categorySrv = categorySrv;
        this.loader = this.configSrv.getConfig()
            .flatMap(config => Observable_1.Observable.combineLatest(Observable_1.Observable.of(config), this.userSrv.me()))
            .do(x => console.log("debug loader", x))
            .publishReplay(1)
            .refCount();
    }
    ready() {
        return this.loader;
    }
};
LoaderService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [http_1.Http,
        config_service_1.ConfigService,
        user_service_1.UserService,
        category_service_1.CategoryService])
], LoaderService);
exports.LoaderService = LoaderService;
//# sourceMappingURL=loader.service.js.map