import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { Category } from './category.service';
import { User } from './user.service';

import { ConfigService } from './config.service';
import { Utils } from './util'

//https://stackoverflow.com/questions/13142635/how-can-i-create-an-object-based-on-an-interface-file-definition-in-typescript

export class Shop {
  deleted:boolean;
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
    bio:boolean;
    gluten:boolean;
    lactose:boolean;
    vegetarian:boolean;
    local:boolean;
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


  available:{
    active:boolean;
    from:Date,
    to:Date,
    weekdays:[number],
    comment:string
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
    comment: { type: String }
  };

  //
  // type Date on pending, set true on active, false on deleted
  status: any;
  // secret value for the business model
  // - > is available/displayed for shop owner and admin ONLY
  // - > is saved on each order to compute bill
  account:{
    fees?:number;
    tva:{
      number?:number,
      fees?:number
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

    let defaultShop = {

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
    json=json||{};
    Object.assign(this,Utils.merge(defaultShop,json));      
  }
}

@Injectable()
export class ShopService {
  //
  // common multicast to update UX when one shop on the list is modified

  public  shop$: ReplaySubject<Shop>;

  private config: any;
  private headers: Headers;
  private cache = {
    list: [],
    map: new Map<string, Shop>()
  };


  constructor(
    private configSrv: ConfigService,
    private http: Http
  ) {
    this.config = ConfigService.defaultConfig;
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');

    //
    // 1 means to keep the last value
    this.shop$ = new ReplaySubject(1);
    this.cache={
      list:[],
      map:new Map()
    };
  }


  //
  // simple cache manager
  private deleteCache(shop: Shop, propagate:boolean=false) {
    shop.deleted=true;
    if (this.cache.map[shop.urlpath]) {
      delete this.cache.map[shop.urlpath];
    }
    if(propagate)this.shop$.next(shop);    
    return shop;
  }

  private updateCache(shop: Shop, propagate:boolean=false) {
    if (!this.cache.map[shop.urlpath]) {
      this.cache.map[shop.urlpath] = new Shop(shop);
      return this.cache.map[shop.urlpath];
    }
    //
    //update existing entry
    Object.assign(this.cache.map[shop.urlpath],shop)
    if(propagate)this.shop$.next(shop);
    return this.cache.map[shop.urlpath];
  }


  //
  // REST api wrapper
  //

  query(filter?: any):Observable<Shop[]> {
    return this.http.get(this.config.API_SERVER + '/v1/shops', {
      headers: this.headers,
      withCredentials: true,
      search: filter,
    })
    .map(res => res.json().map(this.updateCache.bind(this)));
};

  findByCatalog(cat, filter): Observable<Shop[]> {
    return this.http.get(this.config.API_SERVER + '/v1/shops/category/' + cat, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => res.json().map(this.updateCache.bind(this)));
  };

  //
  // get a single shop
  get(urlpath): Observable<Shop> {
    return this.http.get(this.config.API_SERVER + '/v1/shops/' + urlpath, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => this.updateCache(res.json()));
  };

  //
  // TODO: what is it used for ?
  publish(shop: Shop): Observable<Shop> {
    return this.http.get(this.config.API_SERVER + '/v1/shops/' + shop.urlpath + '/status', {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => this.updateCache(res.json(),true));
  };

  //
  // send question to a shop
  ask(shop: Shop, content: string): Observable<any> {
    return this.http.post(this.config.API_SERVER + '/v1/shops/' + shop.urlpath + '/status',
      {
        content: content
      }, {
        headers: this.headers,
        withCredentials: true
      });
    };

  save(shop: Shop): Observable<Shop> {
    return this.http.post(this.config.API_SERVER + '/v1/shops/' + shop.urlpath, shop, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => this.updateCache(res.json(),true))
  };

  //
  // create a new shop for the current user
  // TODO: user must reload his profile when shop is modified
  create(shop: Shop): Observable<Shop> {
    return this.http.post(this.config.API_SERVER + '/v1/shops', shop, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => this.updateCache(res.json(),true));
  };

  //
  // delete shop for the current user
  // TODO: user must reload his profile when shop is modified
  remove(shop: Shop, password: string): Observable<any> {
    // TODO user.shops.pop(me);
    // TODO $rootScope.$broadcast("shop.remove",me);
    //return this.http.delete(this.config.API_SERVER + '/v1/shops/' + shop.urlpath, {
    var passwordJson = { "password": password };
    return this.http.put(this.config.API_SERVER + '/v1/shops/' + shop.urlpath, passwordJson, {
      headers: this.headers,
      withCredentials: true,
    })
    .map(res => this.deleteCache(res.json(),true))
};

}
