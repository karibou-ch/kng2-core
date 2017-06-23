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
require("rxjs/add/operator/map");
let ConfigService = class ConfigService {
    constructor(http) {
        this.http = http;
        this.defaultConfig = {
            API_SERVER: 'http://localhost:4000',
            API_VERSION: '/v1',
            LOG_LEVEL: 'debug',
            AUTH_SUCCESS_REDIRECT_URL: '/',
            AUTH_ERROR_REDIRECT_URL: '/login',
            uploadcare: 'b51a13e6bd44bf76e263',
            staticMapKey: "AIzaSyD5w46BmWX6hX-uJ2yMycS_cRb2HRvDXQU",
            disqus: '7e23b8cfd1ba48cdb5a3487efcbcdc56',
            github: {
                repo: 'evaletolab/karibou-doc',
                token: '7b24b8ec909903ad91d4548fc6025badaf1501bc'
            },
            cover: '',
            postfinance: {
                url: 'https://e-payment.postfinance.ch/ncol/test/orderstandard_utf8.asp'
            },
            user: {
                photo: '//placehold.it/80x80',
            },
            shared: {
                photo: {
                    fg: "//placehold.it/400x300",
                    owner: "//placehold.it/80x80&text=owner",
                    bg: ''
                }
            },
            loginPath: ['/admin', '/account'],
            readonlyPath: ['/wallet/create'],
            avoidShopUIIn: ['/admin', '/login', '/signup', '/page'],
        };
        this.headers = new http_1.Headers();
        this.headers.append('Content-Type', 'application/json');
        this.config = this.http.get(this.defaultConfig.API_SERVER + '/v1/config?lang=', {
            headers: this.headers,
            withCredentials: true,
        })
            .map(res => {
            let config = { shared: {} };
            Object.assign(config, this.defaultConfig);
            Object.assign(config.shared, res.json());
            return config;
        });
    }
    getConfig() {
        return this.config;
    }
};
ConfigService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [http_1.Http])
], ConfigService);
exports.ConfigService = ConfigService;
//# sourceMappingURL=config.service.js.map