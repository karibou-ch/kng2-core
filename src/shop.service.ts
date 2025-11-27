import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Category } from './category.service';
import { User } from './user.service';

import { ConfigService } from './config.service';
import { Utils } from './util';

import { ReplaySubject ,  Observable, BehaviorSubject, from } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { AnalyticsService } from './metrics.service';
import { configCors } from './config';

export class Shop {
  // tslint:disable-next-line: variable-name
  _id: string;
  deleted: boolean;
  urlpath: string;
  name: string;
  description: string;
  url: string;
  photo: {
    owner: string;
    bg: string;
    fg: string;
    logo: string;
    gallery: string[];
    source: string;
  };

  details:{
    bio: boolean;
    gluten: boolean;
    lactose: boolean;
    vegetarian: boolean;
    local: boolean;
  };


  //
  // define where this shop is available for collect
  collect?: {
    streetAdress: string;
    postalCode: string;
    geo: {
      lat: number;
      lng: number;
    }
  };

  //
  // where shop is located
  address: {
    // an other place where things are stored
    depository: string;
    name: string;
    floor: string;
    phone: string;
    streetAdress: string;
    region: string;
    postalCode: string;
    geo: {
      lat: number;
      lng: number;
    }
  };

  //
  // this shop belongsTo a category

  catalog: Category;

  //
  // answer question about your shop
  faq?: [{
    q: string;
    a: string;
    updated: Date;
  }];


  available: {
    categories: string[];
    active: boolean;
    from: Date,
    to: Date,
    weekdays: number[],
    comment: string
};

  discount: {
    amount: number;
    threshold: number;
    active: boolean;
  };

  info: {
    //
    // requiere a detailled email for order preparation
    detailledOrder: boolean;
    active: boolean;
    comment: { type: string }
  };

  //
  // type Date on pending, set true on active, false on deleted
  status: any;
  // secret value for the business model
  // - > is available/displayed for shop owner and admin ONLY
  // - > is saved on each order to compute bill
  account:{
    businessName?: string;
    IBAN?: string;
    BIC?: string;
    fees?: number;
    tva: {
      number?: string,
      fees?: number
    },
    updated: Date;
  };
  owner: User;
  scoring: {
    weight: number;
    orders: number;
    issues: number;
    score: number;
  };
  created: Date;
  marketplace: string[];

  //
  // Object methods




  constructor(json?: any) {

    const defaultShop = {

      photo: {
        gallery: []
      },

      details: {
        bio: false,
        gluten: false,
        lactose: false,
        vegetarian: false,
        local: false,
      },

      address: {
        geo: {},
      },

      catalog: new Category(),

      available: {
        active: false,
        weekdays: []
      },

      discount: {
        active: false,
      },

      info: {
        //
        // requiere a detailled email for order preparation
        detailledOrder: false,
        active: false
      },

      owner: {},
      //
      // type Date on pending, set true on active, false on deleted
      status: false,
      // secret value for the business model
      // - > is available/displayed for shop owner and admin ONLY
      // - > is saved on each order to compute bill
      account: {
        tva: {}
      },
      scoring: {}
    };

    /*address: {
      depository: "",
      name: "",
      floor: "",
      phone: "",
      streetAdress: "",
      region: "",
      postalCode: "",
      geo: {
        lat: 0,
        lng: 0,
      }
    },
    catalog: "",
    description: "",
    name: ""
  }*/
    json = json || {};
    Object.assign(this, Utils.merge(defaultShop, json));
    this.account.tva = this.account.tva || {};
    this.available.weekdays = this.available.weekdays || [];
    this.address = this.address || {geo: {lat: 0, lng: 0}} as any;
  }

}

@Injectable()
export class ShopService {
  //
  // common multicast to update UX when one shop on the list is modified

  public  shop$: ReplaySubject<Shop>;
  public  shops$: BehaviorSubject<Shop[]> | ReplaySubject<Shop[]>;

  private config: any;
  private headers: HttpHeaders;
  private cache = {
    list: [],
    map: new Map<string, Shop>()
  };


  constructor(
    private http: HttpClient
  ) {
    this.config = ConfigService.defaultConfig;
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control' : 'no-cache',
      'Pragma' : 'no-cache',
      'ngsw-bypass':'true',
      'k-dbg': AnalyticsService.FBP
    });
    //
    // 1 means to keep the last value
    this.shop$ = new ReplaySubject(1);
    this.shops$ = new BehaviorSubject<Shop[]>(null);
    this.cache = {
      list: [],
      map: new Map()
    };
  }


  //
  // simple cache manager
  private deleteCache(shop: Shop, propagate?: boolean) {
    shop.deleted = true;
    if (this.cache.map[shop.urlpath]) {
      delete this.cache.map[shop.urlpath];
    }
    if (propagate) {this.shop$.next(shop); }
    return shop;
  }

  private updateCache(shop: Shop, propagate?: boolean): Shop {
    if (!this.cache.map[shop.urlpath]) {
      this.cache.map[shop.urlpath] = new Shop(shop);
      return this.cache.map[shop.urlpath];
    }
    //
    // update existing entry
    Object.assign(this.cache.map[shop.urlpath], shop);
    if(propagate){this.shop$.next(shop); }
    return this.cache.map[shop.urlpath];
  }


  //
  // REST api wrapper
  //

  query(filter?: any): Observable<Shop[]> {
    filter = filter || {};
    filter.rnd = Date.now();
    return this.http.get<Shop[]>(this.config.API_SERVER + '/v1/shops', {
      headers: this.headers,
      withCredentials: (configCors()),
      params: filter,
    }).pipe(
      catchError(err => from([])),
      map(shops => shops.map(this.updateCache.bind(this)) as Shop[]),
      tap(shops => {
        this.shops$.next(shops);
      })
    );
}

  findByCatalog(cat, filter): Observable<Shop[]> {
    return this.http.get<Shop[]>(this.config.API_SERVER + '/v1/shops/category/' + cat, {
      headers: this.headers,
      withCredentials: (configCors())
    }).pipe(
      map(shops => shops.map(this.updateCache.bind(this)) as Shop[]),
      tap(shops => {
        this.shops$.next(shops);
      })
    );
  }

  //
  // get a single shop
  get(urlpath): Observable<Shop> {
    return this.http.get<Shop>(this.config.API_SERVER + '/v1/shops/' + urlpath, {
      headers: this.headers,
      withCredentials: (configCors())
    }).pipe(
      map(shop => this.updateCache(shop, true))
    );
  }

  //
  // TODO: what is it used for ?
  publish(shop: Shop): Observable<Shop> {
    return this.http.get<Shop>(this.config.API_SERVER + '/v1/shops/' + shop.urlpath + '/status', {
      headers: this.headers,
      withCredentials: (configCors())
    }).pipe(
      map(shop => this.updateCache(shop, true))
    );
  }

  //
  // send question to a shop
  ask(shop: Shop, content: string): Observable<any> {
    return this.http.post<Shop>(this.config.API_SERVER + '/v1/shops/' + shop.urlpath + '/status',
      {
        content: content
      }, {
        headers: this.headers,
        withCredentials: (configCors())
      });
    }

  save(shop: Shop): Observable<Shop> {
    delete shop['__v'];
    return this.http.post<Shop>(this.config.API_SERVER + '/v1/shops/' + shop.urlpath, shop, {
      headers: this.headers,
      withCredentials: (configCors())
    }).pipe(
      map(shop => this.updateCache(shop, true))
    );
  }

  //
  // create a new shop for the current user
  // TODO: user must reload his profile when shop is modified
  create(shop: Shop): Observable<Shop> {
    return this.http.post<Shop>(this.config.API_SERVER + '/v1/shops', shop, {
      headers: this.headers,
      withCredentials: (configCors())
    }).pipe(
      map(shop => this.updateCache(shop, true))
    );
  }

  //
  // delete shop for the current user
  // TODO: user must reload his profile when shop is modified
  remove(shop: Shop, password: string): Observable<any> {
    const passwordJson = { "password": password };
    return this.http.put<Shop>(this.config.API_SERVER + '/v1/shops/' + shop.urlpath, passwordJson, {
      headers: this.headers,
      withCredentials: (configCors()),
    }).pipe(
      map(shop => this.deleteCache(shop, true))
    );
}

}
