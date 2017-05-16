import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'moment/locale/fr';
import { ConfigService } from './config.service';
export declare class Shop {
    name: string;
    constructor();
}
export declare class User {
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
    populateAdresseName(user?: any): void;
    getBVR(): void;
    init(): void;
}
export declare class UserService {
    config: ConfigService;
    http: Http;
    defaultUser: {
        id: string;
        name: {
            givenName: string;
            familyName: string;
        };
        email: {};
        reminder: {
            weekdays: any[];
        };
        roles: any[];
        shops: any[];
        provider: string;
        url: string;
        phoneNumbers: {
            what: string;
        }[];
        addresses: any[];
        logistic: {
            postalCode: any[];
        };
    };
    private headers;
    constructor(config: ConfigService, http: Http);
    ge(id: number): Observable<any>;
    me(cb: any): void;
}
