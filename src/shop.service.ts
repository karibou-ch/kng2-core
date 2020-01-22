import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Category } from './category.service';
import { User } from './user.service';

import { ConfigService } from './config.service';
import { Utils } from './util';

import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

// https://stackoverflow.com/questions/13142635/how-can-i-create-an-object-based-on-an-interface-file-definition-in-typescript

export class Shop {
  public deleted: boolean;
  public urlpath: string;
  public name: string;
  public description: string;
  public url: string;
  public photo: {
    owner: string;
    bg: string;
    fg: string;
    logo: string;
    gallery: string[];
    source: string;
  };

  public details: {
    bio: boolean;
    gluten: boolean;
    lactose: boolean;
    vegetarian: boolean;
    local: boolean;
  };

  //
  // define where this shop is available for collect
  public collect?: {
    streetAdress: string;
    postalCode: string;
    geo: {
      lat: number;
      lng: number;
    }
  };

  //
  // where shop is located
  public address: {
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

  public catalog: Category;

  //
  // answer question about your shop
  public faq?: [{
    q: string;
    a: string;
    updated: Date;
  }];

  public available: {
    active: boolean;
    from: Date,
    to: Date,
    weekdays: number[],
    comment: string
};

  public discount: {
    amount: number;
    threshold: number;
    active: boolean;
  };

  public info: {
    //
    // requiere a detailled email for order preparation
    detailledOrder: boolean;
    active: boolean;
    comment: { type: String }  // TOCHECK  doit pouvoir être ainsi comment: { type: string } 
  };

  //
  // type Date on pending, set true on active, false on deleted
  public status: any;
  // secret value for the business model
  // - > is available/displayed for shop owner and admin ONLY
  // - > is saved on each order to compute bill
  public account: {
    IBAN?: string;
    fees?: number;
    tva: {
      number?: string,
      fees?: number
    },
    updated: Date;
  };
  public owner: User;
  public scoring: {
    weight: number;
    orders: number;
    issues: number;
    score: number;
  };
  public created: Date;
  public marketplace: string[];

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
  }

}

@Injectable()
export class ShopService {
  //
  // common multicast to update UX when one shop on the list is modified

  public  shop$: ReplaySubject<Shop>;

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
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');

    //
    // 1 means to keep the last value
    this.shop$ = new ReplaySubject(1);
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

  private updateCache(shop: Shop, propagate?: boolean) {
    if (!this.cache.map[shop.urlpath]) {
      this.cache.map[shop.urlpath] = new Shop(shop);
      return this.cache.map[shop.urlpath];
    }
    //
    // update existing entry
    Object.assign(this.cache.map[shop.urlpath], shop);
    if (propagate) {this.shop$.next(shop); }
    return this.cache.map[shop.urlpath];
  }

  //
  // REST api wrapper
  //

  public query(filter?: any): Observable<Shop[]> {
    return this.http.get<Shop[]>(this.config.API_SERVER + '/v1/shops', {
      headers: this.headers,
      withCredentials: true,
      params: filter,
    }).pipe(
      map((shops) => shops.map(this.updateCache.bind(this)))
    );
}

  public findByCatalog(cat, filter): Observable<Shop[]> {
    return this.http.get<Shop[]>(this.config.API_SERVER + '/v1/shops/category/' + cat, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((shops) => shops.map(this.updateCache.bind(this)))
    );
  }

  //
  // get a single shop
  public get(urlpath): Observable<Shop> {
    return this.http.get<Shop>(this.config.API_SERVER + '/v1/shops/' + urlpath, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((shop) => this.updateCache(shop))
    );
  }

  //
  // TODO: what is it used for ?
  public publish(shop: Shop): Observable<Shop> {
    return this.http.get<Shop>(this.config.API_SERVER + '/v1/shops/' + shop.urlpath + '/status', {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((shop) => this.updateCache(shop))
    );
  }

  //
  // send question to a shop
  public ask(shop: Shop, content: string): Observable<any> {
    return this.http.post<Shop>(this.config.API_SERVER + '/v1/shops/' + shop.urlpath + '/status',
      {
        content
      }, {
        headers: this.headers,
        withCredentials: true
      });
    }

  public save(shop: Shop): Observable<Shop> {
    return this.http.post<Shop>(this.config.API_SERVER + '/v1/shops/' + shop.urlpath, shop, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((shop) => this.updateCache(shop))
    );
  }

  //
  // create a new shop for the current user
  // TODO: user must reload his profile when shop is modified
  public create(shop: Shop): Observable<Shop> {
    return this.http.post<Shop>(this.config.API_SERVER + '/v1/shops', shop, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((shop) => this.updateCache(shop))
    );
  }

  //
  // delete shop for the current user
  // TODO: user must reload his profile when shop is modified
  public remove(shop: Shop, password: string): Observable<any> {
    // TODO user.shops.pop(me);
    // TODO $rootScope.$broadcast("shop.remove",me);
    // return this.http.delete(this.config.API_SERVER + '/v1/shops/' + shop.urlpath, {
     // TOCHECK TSLINT 
    let passwordJson = { 'password': password };
    return this.http.put<Shop>(this.config.API_SERVER + '/v1/shops/' + shop.urlpath, passwordJson, {
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map((shop) => this.deleteCache(shop))
    );
}

}
