import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import { Config } from './config';
export declare class ConfigService {
    http: Http;
    defaultConfig: {
        API_SERVER: string;
        API_VERSION: string;
        LOG_LEVEL: string;
        AUTH_SUCCESS_REDIRECT_URL: string;
        AUTH_ERROR_REDIRECT_URL: string;
        uploadcare: string;
        staticMapKey: string;
        disqus: string;
        github: {
            repo: string;
            token: string;
        };
        cover: string;
        postfinance: {
            url: string;
        };
        user: {
            photo: string;
        };
        shared: {
            photo: {
                fg: string;
                owner: string;
                bg: string;
            };
        };
        loginPath: string[];
        readonlyPath: string[];
        avoidShopUIIn: string[];
    };
    private headers;
    config: Observable<Config>;
    constructor(http: Http);
    getConfig(): Observable<Config>;
}
