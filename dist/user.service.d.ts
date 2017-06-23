import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/from';
import 'moment/locale/fr';
import { ConfigService } from './config.service';
export declare class Shop {
    name: string;
    constructor();
}
export declare class User {
    constructor();
    id: string;
    provider: string;
    email: {
        address: string;
        cc: string;
        status: any;
    };
    displayName: string;
    name: {
        familyName: string;
        givenName: string;
    };
    birthday: Date;
    gender: string;
    tags: string[];
    url: string;
    phoneNumbers: [{
        number: string;
        what: string;
    }];
    photo: string;
    addresses: [{
        name: string;
        note: string;
        floor: string;
        streetAdress: string;
        region: string;
        postalCode: string;
        primary: boolean;
        geo: {
            lat: number;
            lng: number;
        };
    }];
    logistic: {
        postalCode: string;
    };
    likes: number[];
    shops: Shop[];
    context: any;
    payments: any[];
    merchant: boolean;
    reminder: {
        active: boolean;
        weekdays: number[];
        time: number;
    };
    status: boolean;
    created: Date;
    updated: Date;
    logged: Date;
    roles: string[];
    rank: string;
    display(): string;
    loggedTime(): number;
    isOwner(shopname: any): boolean;
    isOwnerOrAdmin(shopname: any): boolean;
    isAuthenticated(): boolean;
    isAdmin(): boolean;
    isReady(): boolean;
    hasRole(role: any): boolean;
    hasLike(product: any): boolean;
    hasPrimaryAddress(): string | false | 0;
    getEmailStatus(): string | boolean;
    populateAdresseName(): void;
    getBVR(): void;
    init(): void;
}
export declare class UserService {
    configSrv: ConfigService;
    http: Http;
    defaultUser: User;
    config: any;
    currentUser: User;
    private cache;
    private deleteCache(user);
    private updateCache(user);
    private headers;
    private user$;
    constructor(configSrv: ConfigService, http: Http);
    get(id: number): Observable<User>;
    me(): Observable<User>;
    query(filter?: any): Observable<User[]>;
    validate(id: any, email: any): Observable<any>;
    validateEmail(email: any): Observable<any>;
    recover(token: any, email: any, recover: any): Observable<any>;
    save(user: any): Observable<User>;
    logout(): Observable<User>;
    register(user: any): Observable<User>;
    newpassword(id: any, change: any): Observable<any>;
    login(data: any): Observable<User>;
    createShop(shop: any): Observable<Shop>;
    remove(id: any, password: any): Observable<any>;
    love(id: any, product: any): Observable<User>;
    geocode(street: any, postal: any, region: any): Observable<any>;
    updateGeoCode(user: User): Observable<any>;
    checkPaymentMethod(user: any): Observable<User>;
    addPaymentMethod(payment: any, uid: any): Observable<User>;
    deletePaymentMethod(alias: any, uid: any): Observable<User>;
    updateStatus(id: any, status: any): Observable<User>;
}
