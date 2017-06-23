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
const loader_service_1 = require("./loader.service");
const router_1 = require("@angular/router");
const user_service_1 = require("./user.service");
let AuthGuardService = class AuthGuardService {
    constructor(loaderSrv, _router, userSrv) {
        this.loaderSrv = loaderSrv;
        this._router = _router;
        this.userSrv = userSrv;
    }
    canActivate() {
        return this.userSrv.currentUser.isAuthenticated();
    }
};
AuthGuardService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [loader_service_1.LoaderService,
        router_1.Router,
        user_service_1.UserService])
], AuthGuardService);
exports.AuthGuardService = AuthGuardService;
//# sourceMappingURL=auth-guard.service.js.map