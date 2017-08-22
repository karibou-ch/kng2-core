import { Http, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs/Rx';
import { ConfigService } from './config.service';

@Injectable()
export class ProductService {

    public product$: ReplaySubject<Product>;
    private headers: Headers;
    config: any;

    private cache: {
        list: Product[];
        map: Map<string, Product>;
    }

    constructor(
        private configSrv: ConfigService,
        private http: Http
    ) {
        this.config = ConfigService.defaultConfig;
        this.headers = new Headers();
        this.headers.append('Content-Type', 'application/json');

        //
        // 1 means to keep the last value
        this.product$ = new ReplaySubject(1);
    }

    private deleteCache(cat: Product) {
        if (this.cache.map[cat.slug]) {
            this.cache.map.delete(cat.slug);
            let index = this.cache.list.indexOf(cat)
            if (index > -1)
                this.cache.list.splice(index, 1);
        }
    }

    private updateCache(product: Product) {
        //
        //check if already exist on cache and add in it if not the case
        if (!this.cache.map[product.slug]) {
            this.cache.map[product.slug] = product;
            this.cache.list.push(product);
            return;
        }
        //update existing entry
        return Object.assign(this.cache.map[category.slug], category);
    }


    //
    // REST api wrapper
    //

    query(filter): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products', {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json() as Product[])
            .map(products => products.map(this.updateCache))
            .do(this.product$.next)
            .catch(this.handleError);
    };





    private handleError(error: Response | any) {
        //
        // In a real world app, you might use a remote logging infrastructure
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || '';
            const err = JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return Observable.throw(errMsg);
    }
}


export class Product {
    _id;
    title: string;
    category: {
        _id;
        name: string;
        weight: number;
    };
    sku: number;
    vendor: {
        _id;
        urlpath: string;
        catalog;
        name: string;
        description: string;
        owner: any;
        __v;
        status: boolean;
        url: string;
        created: Date;
        scoring: {
            score: number;
            issues: number;
            weight: number;
        };
        account: {
            updated: Date;
        };
        info: {
            detailledOrder: boolean;
            active: boolean;
        };
        discount: {
            active: boolean;
        };
        available: {
            active: boolean;
            from: Date,
            to: Date,
            weekdays: [number],
            comment: string
        };
        faq?: [{
            q: string;
            a: string;
            updated: Date;
        }];
        address: {
            name: string;
            phone: string;
            streetAdress: string;
            floor: string;
            postalCode: string;
            geo: {
                lat: number;
                lng: number;
            };
            region: string;
        };
        marketplace;
        detail: {
            local: boolean;
            vegetarian: boolean;
            lactose: boolean;
            gluten: boolean;
            bio: boolean;
        };
        photo: {
            gallery;
        };
        version: number;
    };
    slug: string;
    __v;
    updated: Date;
    created: Date;
    faq?: [{
        q: string;
        a: string;
        updated: Date;
    }];
    photo: {
        url: string;
    };
    pricing: {
        price: number;
        part: string;
        tva: number;
        stock: number;
    };
    variants;
    shelflife: {
        display: boolean;
    };
    quantity: {
        display: boolean;
    };
    attributes: {
        discount: boolean;
        weight: number;
        comment: boolean;
        available: boolean;
        home: boolean;
    };
    details: {
        keywords: string;
        internal;
        description: string;
        origine: string;
        biodegradable: boolean;
        vegetarian: boolean;
        bioconvertion: boolean;
        biodynamics: boolean;
        grta: boolean;
        bio: boolean;
        local: boolean;
        natural: boolean;
        homemade: boolean;
        cold: boolean;
        gluten: boolean;
        lactose: boolean;
    };
}