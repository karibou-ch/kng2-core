"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
const common_1 = require("@angular/common");
const user_pipe_1 = require("./user.pipe");
const user_service_1 = require("./user.service");
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
            user_service_1.UserService
        ],
        exports: [
            user_pipe_1.UserPipe
        ]
    })
], Kng2CoreModule);
exports.Kng2CoreModule = Kng2CoreModule;
//# sourceMappingURL=kng2-core.module.js.map