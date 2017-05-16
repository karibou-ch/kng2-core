import { Http } from '@angular/http';
export declare class ConfigService {
    http: Http;
    API_SERVER: '';
    API_VERSION: '/v1';
    LOG_LEVEL: 'debug';
    AUTH_SUCCESS_REDIRECT_URL: '/';
    AUTH_ERROR_REDIRECT_URL: '/login';
    uploadcare: 'b51a13e6bd44bf76e263';
    staticMapKey: "AIzaSyD5w46BmWX6hX-uJ2yMycS_cRb2HRvDXQU";
    disqus: '7e23b8cfd1ba48cdb5a3487efcbcdc56';
    github: {
        repo: 'evaletolab/karibou-doc';
        token: '7b24b8ec909903ad91d4548fc6025badaf1501bc';
    };
    cover: '';
    postfinance: {
        url: 'https://e-payment.postfinance.ch/ncol/test/orderstandard_utf8.asp';
    };
    user: {
        photo: '//placehold.it/80x80';
    };
    shop: {
        photo: {
            fg: "//placehold.it/400x300";
            owner: "//placehold.it/80x80&text=owner";
            bg: '';
        };
    };
    loginPath: ['/admin', '/account'];
    readonlyPath: ['/wallet/create'];
    avoidShopUIIn: ['/admin', '/login', '/signup', '/page'];
    private headers;
    constructor(http: Http);
}
