import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { config } from './config';
import { ConfigService } from './config.service';

import { Utils } from './util';

import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { of } from 'rxjs/observable/of';
import { _throw } from 'rxjs/observable/throw';
import { map,tap } from 'rxjs/operators';


@Injectable()
export class ProductService {

    public product$: ReplaySubject<Product>;
    private headers: HttpHeaders;
    private config: any;
    private cache = new Cache();

    constructor(
        private configSrv: ConfigService,
        private http: HttpClient
    ) {
        this.config = ConfigService.defaultConfig;
        this.headers = new HttpHeaders();
        this.headers.append('Content-Type', 'application/json');
        this.cache=new Cache();
        //
        // 1 means to keep the last value
        this.product$ = new ReplaySubject(1);
    }

    private updateCache(product: Product) {
        if(!this.cache.map.get(product.sku)){
            this.cache.map.set(product.sku,new Product(product))
            return this.cache.map.get(product.sku);
        }
        //
        // clear date field to avoid type collusion
        delete product.updated;
        delete product.created;
        return Object.assign(this.cache.map.get(product.sku), product);
    }

    private deleteCache(product: Product) {
        let incache=this.cache.map.get(product.sku);
        if (incache) {
            incache.deleted=true;
            this.cache.map.delete(product.sku);
        }
        return incache;
    }


    //
    // REST api wrapper
    //

    search(text:string): Observable<Product[]> {
        return this.http.get<Product[]>(this.config.API_SERVER + '/v1/products/search', {
            params: {q:text},
            headers: this.headers,
            withCredentials: true
        }).pipe(
            map(products => products)
        );
    };

    select(params?: any): Observable<Product[]> {
        params = params || {};
        return this.http.get<Product[]>(this.config.API_SERVER + '/v1/products', {
            params: params,
            headers: this.headers,
            withCredentials: true
        }).pipe(
            map(products => products.map(this.updateCache.bind(this)))
        );
    };

    findByLocationCategoryAndDetail(category, detail): Observable<Product[]> {
        return this.http.get<Product[]>(this.config.API_SERVER + '/v1/products/location/' + location + '/category/' + category + '/details/' + detail, {
            headers: this.headers,
            withCredentials: true
        }).pipe(
            map(products => products.map(this.updateCache.bind(this)))
        );
    };

    findByCategoryAndDetail(category, detail): Observable<Product[]> {
        return this.http.get<Product[]>(this.config.API_SERVER + '/v1/products/category/' + category + '/details/' + detail, {
            headers: this.headers,
            withCredentials: true
        }).pipe(
            map(products => products.map(this.updateCache.bind(this)))
        );
    };

    findByLocationAndCategory(location, category): Observable<Product[]> {
        return this.http.get<Product[]>(this.config.API_SERVER + '/v1/products/location/' + location + '/category/' + category, {
            headers: this.headers,
            withCredentials: true
        }).pipe(
            map(products => products.map(this.updateCache.bind(this)))
        );
    };

    findLove(params?:any): Observable<Product[]> {
        params = params || {};
        return this.http.get<Product[]>(this.config.API_SERVER + '/v1/products/love', {
            params:params,
            headers: this.headers,
            withCredentials: true
        }).pipe(
            map(products => products.map(this.updateCache.bind(this)))
        );
    };

    findByLocation(location): Observable<Product[]> {
        return this.http.get<Product[]>(this.config.API_SERVER + '/v1/products/location/' + location, {
            headers: this.headers,
            withCredentials: true
        }).pipe(
            map(products => products.map(this.updateCache.bind(this)))
        );
    };

    findByCategory(category:string,params?:any): Observable<Product[]> {
        params = params || {};
        return this.http.get<Product[]>(this.config.API_SERVER + '/v1/products/category/' + category, {
            params:params,
            headers: this.headers,
            withCredentials: true
        }).pipe(
            map(products => products.map(this.updateCache.bind(this)))
        );
    };

    findBySku(sku): Observable<Product> {
        return this.get(sku)
    };

    //
    // get product based on its sku
    get(sku): Observable<Product> {
        let cached: Observable<Product>;

        // check if in the cache
        if (this.cache.map.get(sku)) {
            return of(this.cache.map.get(sku));
        }
        return this.http.get<Product>(this.config.API_SERVER + '/v1/products/' + sku, {
            headers: this.headers,
            withCredentials: true
        }).pipe(
            map(product => this.updateCache(product)),
            tap(this.product$.next.bind(this.product$))  
        );
    };

    remove(sku:number,password:string):Observable<any>{
      var passwordJson = {"password":password};
      return this.http.put<Product>(this.config.API_SERVER + '/v1/products/'+sku, passwordJson, {
        headers: this.headers,
        withCredentials: true
      }).pipe(
        map(product => this.deleteCache(product)),
        tap(this.product$.next.bind(this.product$))  
      );
    };

    create(prod: Product, shopowner:string): Observable<Product> {
        //
        // FIXME creattion code is not correct
        return this.http.post<Product>(this.config.API_SERVER + '/v1/shops/'+shopowner+'/products/', prod, {
            headers: this.headers,
            withCredentials: true
        }).pipe(
            map(product => this.updateCache(product)),
            tap(this.product$.next.bind(this.product$))  
        );
    };

    save(prod: Product): Observable<Product> {
        return this.http.post<Product>(this.config.API_SERVER + '/v1/products/' + prod.sku, prod, {
            headers: this.headers,
            withCredentials: true
        }).pipe(
            map(product => this.updateCache(product)),
            tap(this.product$.next.bind(this.product$))  
        );
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
        return _throw(errMsg);
    };
}

class Cache {
    list: Product[];
    map: Map<number, Product>
    constructor() {
        this.list = [];
        this.map = new Map();
    }
}


export class Product {

    constructor(json?: any) {
        let defaultProduct={
            attributes:{},
            details:{},
            photo:{},
            pricing:{},
            categories:{},
            shelflife:{},
            vendor:{},
            quantity:{},
            belong:{
                weight:0
            },
            stats:{
                score:0,
                issues:0,
                sales:0
            }
        }

        Object.assign(this, defaultProduct,json||{});          
            
        if(this.updated){
            this.updated=new Date(this.updated);
        }
        if(this.created){
            this.created=new Date(this.created);
        }
    };
    deleted:boolean;
    title: string;
    variants:any[];
    sku: number;
    slug: string;
    updated: Date;
    created: Date;
    categories: any;
    vendor:any;
    faq?: [{
        q: string;
        a: string;
        updated: Date;
    }];
    photo: {
        url: string;
    };
    pricing: {
        discount:number;
        price: number;
        part: string;
        tva: number;
        stock: number;
    };
    shelflife: {
        display: boolean;
        comment:string;
    };
    quantity: {
        display: boolean;
        comment:string;
    };
    attributes: {
        discount: boolean;
        weight: number;
        comment: boolean;
        available: boolean;
        home: boolean;
        boost:boolean;
    };
    details: {
        keywords: string;
        internal: string;
        description: string;
        origin: string;
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

    //
    // child category
    belong:{
        name:string;
        weight:number;
    };

    //
    // genetated values
    stats: {
        score: number;
        sales: number;
        issues: number;
    };

    hasFixedPortion(){
        var weight=this.pricing.part||'';
        var m=weight.match(/~([0-9.]+) ?(.+)/);
        return(!m||m.length<2);
    }

    getPrice(){
        if(this.attributes.discount && this.pricing.discount){
        return this.pricing.discount;
        }
        return this.pricing.price;
    }    

    isDiscount(){
        return(this.attributes.discount && this.pricing.discount);
    }    

    isAvailableForOrder() {
        var ok=(this.attributes.available && this.vendor &&
                this.vendor.status===true);
        return ok;
    }

    
}
