import { Http, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
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

        //
        // 1 means to keep the last value
        this.product$ = new ReplaySubject(1);
    }

    private deleteCache(product: Product) {
        if (this.cache.map[product.sku]) {
            this.cache.map.delete(product.sku);
            let index = this.cache.list.indexOf(product)
            if (index > -1)
                this.cache.list.splice(index, 1);
        }
    }

    private updateCache(product: Product) {
        //
        //check if already exist on cache and add in it if not the case
        if (!this.cache.map[product.sku]) {
            this.cache.map[product.sku] = product;
            this.cache.list.push(product);
            return product;
        }
        //update existing entry
        return Object.assign(this.cache.map[product.sku], product);
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
            .map(res => res.json().map(obj => new Product(obj)))
        //.map(products => products.map(this.updateCache.bind(this)))
        //.catch(this.handleError);
    };

    findByLocationCategoryAndDetail(category, detail): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/location/' + location + '/category/' + category + '/details/' + detail, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json().map(obj => new Product(obj)))
        //.map(products => products.map(this.updateCache.bind(this)))
        //.catch(this.handleError);
    };

    findByCategoryAndDetail(category, detail): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/category/' + category + '/details/' + detail, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json().map(obj => new Product(obj)))
        //.map(products => products.map(this.updateCache.bind(this)))
        //.catch(this.handleError);
    };

    findByLocationAndCategory(location, category): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/location/' + location + '/category/' + category, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json().map(obj => new Product(obj)))
        //.map(products => products.map(this.updateCache.bind(this)))
        //.catch(this.handleError);
    };

    findLove(): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/love', {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json().map(obj => new Product(obj)))
        //.map(products => products.map(this.updateCache.bind(this)))
        //.catch(this.handleError);
    };

    findByLocation(location): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/location/' + location, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json().map(obj => new Product(obj)))
        //.map(products => products.map(this.updateCache.bind(this)))
        //.catch(this.handleError);
    };

    findByCategory(category): Observable<Product[]> {
        return this.http.get(this.config.API_SERVER + '/v1/products/category/' + category, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json().map(obj => new Product(obj)))
        //.map(products => products.map(this.updateCache.bind(this)))
        //.catch(this.handleError);
    };

    findBySku(sku): Observable<Product> {
        return this.get(sku)
    };

    //
    // get product based on its sku
    get(sku): Observable<Product> {
        let cached: Observable<Product>;

        // check if in the cache
        if (this.cache.map[sku]) {
            return Observable.of(this.cache.map[sku]);
        }
        return this.http.get(this.config.API_SERVER + '/v1/products/' + sku, {
            headers: this.headers,
            withCredentials: true
        })
            //.map(res => res.json() as Product[])
            //.map(res => res.json() as Product)
            .map(res => new Product(res.json()))
            //.map(this.updateCache)
            //.do(this.product$.next)
            .catch(this.handleError);
    };

    remove(sku:number,password:string):Observable<any>{
      console.log(sku);
      console.log(password);
      var passwordJson = {"password":password};
      return this.http.put(this.config.API_SERVER + '/v1/products/'+sku, passwordJson, {
        headers: this.headers,
        withCredentials: true
      })
        .map(res => res.json() as Product)
        .map(this.deleteCache)
        // TODO what to callback on delete
        .do(()=>this.product$.next(new Product()))
    };

    create(prod: Product): Observable<Product> {
        return this.http.post(this.config.API_SERVER + '/v1/shops/chocolat-de-villars-sur-glane/products/', prod, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => new Product(res.json()))
            //.map(res => res.json().map(obj => new Product(obj)))
            //.map(this.updateCache)
            //.do(this.product$.next)
            .catch(this.handleError);
    };

    save(prod: Product): Observable<Product> {
        return this.http.post(this.config.API_SERVER + '/v1/products/' + prod.sku, prod, {
            headers: this.headers,
            withCredentials: true
        })
            .map(res => res.json() as Product)
            //.map(res => new Product(res.json()))
            //.map(this.updateCache)
            //.do(this.product$.next)
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
        if (json !== undefined) {
            Object.assign(this, json);
        } else {
            let defaultProduct = {
                attributes: {
                    available: false,
                    comment: false,
                    discount: false,
                    home: false,
                    weigth: 0
                },
                categories: "",
                details: {
                    description: "",
                    origin: "",
                    biodegradable: false,
                    vegetarian: false,
                    bioconvertion: false,
                    biodynamic: false,
                    grta: false,
                    bio: false,
                    local: false,
                    natural: false,
                    homemade: false,
                    cold: false,
                    gluten: false,
                    lactose: false
                },
                photo: {
                    url: "//ucarecdn.com/2a857236-1943-4f57-89f6-f1da02cd39dc/"
                },
                pricing: {
                    part: "",
                    price: "",
                    stock: ""
                },
                quantity: {
                    display: false,
                    comment: ""
                },
                title: "",
                urlshop: "chocolat-de-villars-sur-glane"
            }
            Object.assign(this, defaultProduct);
        }
    };

    _id;
    title: string;
    variants;
    sku: number;
    slug: string;
    updated: Date;
    created: Date;
    categories: {
        _id;
        name: string;
        weight: number;
    };
    vendor: {
        _id;
        urlpath: string;
        catalog;
        name: string;
        description: string;
        owner: any;
        status: boolean;
        url: string;
        created: Date;
        marketplace;
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
        internal: string;
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
