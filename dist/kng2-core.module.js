"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
const common_1 = require("@angular/common");
const auth_guard_service_1 = require("./auth-guard.service");
exports.AuthGuardService = auth_guard_service_1.AuthGuardService;
const category_service_1 = require("./category.service");
exports.Category = category_service_1.Category;
exports.CategoryService = category_service_1.CategoryService;
const config_service_1 = require("./config.service");
exports.ConfigService = config_service_1.ConfigService;
const loader_service_1 = require("./loader.service");
exports.LoaderService = loader_service_1.LoaderService;
const order_service_1 = require("./order/order.service");
exports.OrderService = order_service_1.OrderService;
const order_1 = require("./order/order");
exports.Order = order_1.Order;
const user_pipe_1 = require("./user.pipe");
exports.UserPipe = user_pipe_1.UserPipe;
const user_service_1 = require("./user.service");
exports.User = user_service_1.User;
exports.Shop = user_service_1.Shop;
exports.UserService = user_service_1.UserService;
let Kng2CoreModule = class Kng2CoreModule {
};
Kng2CoreModule = __decorate([
    core_1.NgModule({
        imports: [
            common_1.CommonModule
        ],
        declarations: [
            user_pipe_1.UserPipe
        ],
        providers: [
            auth_guard_service_1.AuthGuardService,
            category_service_1.CategoryService,
            config_service_1.ConfigService,
            loader_service_1.LoaderService,
            order_service_1.OrderService,
            user_service_1.UserService
        ],
        exports: [
            user_pipe_1.UserPipe
        ]
    })
], Kng2CoreModule);
exports.Kng2CoreModule = Kng2CoreModule;
__export(require("./order/order.enum"));
var config_1 = require("./config");
exports.Config = config_1.Config;
//# sourceMappingURL=kng2-core.module.js.map