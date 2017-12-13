import { Http, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { config } from './config';
import { ConfigService } from './config.service';

@Injectable()
export class ProductService {

    public product$: ReplaySubject<Product>;
    private headers: Headers;
    private config: any;
    private cache = new Cache();

    constructor(
        private configSrv: ConfigService,
        private http: Http
    ) {
        this.config = ConfigService.defaultConfig;
        this.headers = new Headers();
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

    select(filter?: any): Observable<Product[]> {
        filter = filter || {};
        return this.http.get(this.config.API_SERVER + '/v1/products', {
            search: filter,
            headers: this.headers,
            withCredentials: true
        })
         .map(res => res.json().map(this.updateCache.bind(this)));
    };

    findByLocationCategoryAndDetail(category, detail): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/location/' + location + '/category/' + category + '/details/' + detail, {
            headers: this.headers,
            withCredentials: true
        })
         .map(res => res.json().map(this.updateCache.bind(this)));
    };

    findByCategoryAndDetail(category, detail): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/category/' + category + '/details/' + detail, {
            headers: this.headers,
            withCredentials: true
        })
         .map(res => res.json().map(this.updateCache.bind(this)));
    };

    findByLocationAndCategory(location, category): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/location/' + location + '/category/' + category, {
            headers: this.headers,
            withCredentials: true
        })
         .map(res => res.json().map(this.updateCache.bind(this)));
    };

    findLove(): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/love', {
            headers: this.headers,
            withCredentials: true
        })
         .map(res => res.json().map(this.updateCache.bind(this)));
    };

    findByLocation(location): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/location/' + location, {
            headers: this.headers,
            withCredentials: true
        })
         .map(res => res.json().map(this.updateCache.bind(this)));
    };

    findByCategory(category): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/category/' + category, {
            headers: this.headers,
            withCredentials: true
        })
         .map(res => res.json().map(this.updateCache.bind(this)));
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
            return Observable.of(this.cache.map.get(sku));
        }
        return this.http.get(this.config.API_SERVER + '/v1/products/' + sku, {
            headers: this.headers,
            withCredentials: true
        })
          .map(res => this.updateCache(res.json()))
          .do(this.product$.next.bind(this.product$))
    };

    remove(sku:number,password:string):Observable<any>{
      var passwordJson = {"password":password};
      return this.http.put(this.config.API_SERVER + '/v1/products/'+sku, passwordJson, {
        headers: this.headers,
        withCredentials: true
      })
      .map(res => this.deleteCache(res.json()))
        .do(this.product$.next.bind(this.product$))
    };

    create(prod: Product): Observable<Product> {
        return this.http.post(this.config.API_SERVER + '/v1/shops/chocolat-de-villars-sur-glane/products/', prod, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res=>this.updateCache(res.json()))
            .do(this.product$.next.bind(this.product$));
    };

    save(prod: Product): Observable<Product> {
        return this.http.post(this.config.API_SERVER + '/v1/products/' + prod.sku, prod, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => this.updateCache(res.json()))
            .do(this.product$.next.bind(this.product$));
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
    private defaultProduct={
        attributes:{},
        details:{},
        photo:{},
        pricing:{},
        categories:{},
        shelflife:{},
        vendor:{},
        quantity:{}
    }

    constructor(json?: any) {
        Object.assign(this,json||this.defaultProduct);        
        if(json){
            this.updated=new Date(json.updated);
            this.created=new Date(json.created);
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
