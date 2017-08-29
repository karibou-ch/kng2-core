import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs/Rx';

import { ConfigService } from './config.service';

export class Shop {
  urlpath:string;
  name: string;
  description: string;
  url:string;
  photo:{
    owner:string;
    bg:string;
    fg:string;
    logo:string;
    gallery:string[];
    source:string;
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
  collect?:{
    streetAdress: string;
    postalCode: string;
    geo:{
      lat:number;
      lng:number;
    }
  }

  //
  // where shop is located
  address:{
    // an other place where things are stored
    depository:string;
    name: string;
    floor: string;
    phone: string;
    streetAdress: string;
    region: string;
    postalCode: string;
    geo:{
      lat:number;
      lng:number;
    }
  };

  //
  // this shop belongsTo a category
  catalog:any;

  //
  // answer question about your shop
  faq?:[{
    q:string;
    a:string;
    updated:Date;
  }];

  available:{
    active:boolean;
    from:Date,
    to:Date,
    weekdays:[number],
    comment:string
  };

  discount:{
    amount:number;
    threshold:number;
    active:boolean;
  };

  info:{
    //
    // requiere a detailled email for order preparation
    detailledOrder:boolean;
    active:boolean;
    comment:{type: String}
  };

  //
  // type Date on pending, set true on active, false on deleted
  status:any;
  // secret value for the business model
  // - > is available/displayed for shop owner and admin ONLY
  // - > is saved on each order to compute bill
  account:{
    fees?:number;
    tva:{
      number?:number,
      fees?:number
    },
    updated:Date;
  };
  owner:any;
  scoring:{
    weight:number;
    orders:number;
    issues:number;
    score:number;
  };
  created:Date;

  //
  // Object methods
  constructor() {
    let defaultShop = {
      url:'',
      photo:{fg:''},
      options:{},
      available:{},
      collect:{},
      address:{},
      info:{},
      account:{},
      faq:[]
    }
    Object.assign(this,defaultShop);
  }

};

@Injectable()
export class ShopService {
  //
  // common multicast to update UX when one shop on the list is modified
  public  shop$: ReplaySubject<Shop>;

  private config:any;
  private headers:Headers;
  private cache = {
    list: [],
    map: new Map<string, Shop>()
  };


  constructor(
    private configSrv:ConfigService,
    private http: Http
  ){
    this.config = ConfigService.defaultConfig;
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');

    //
    // 1 means to keep the last value
    this.shop$ = new ReplaySubject(1);
  }


  //
  // simple cache manager
  private deleteCache(cat: Shop) {
    if (this.cache.map[cat.urlpath]) {
      this.cache.map.delete(cat.urlpath);
      let index = this.cache.list.indexOf(cat)
      if (index > -1)
        this.cache.list.splice(index, 1);
    }
  }

  private updateCache(shop:Shop){
    if (!this.cache.map[shop.urlpath]){
      this.cache.map[shop.urlpath] = shop;
      this.cache.list.push(shop);
      return;
    }
    //
    //update existing entry
    return Object.assign(this.cache.map[shop.urlpath],shop);
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
      .map(res => res.json() as Shop[])
      .map(shops => shops.map(this.updateCache));
  };

  findByCatalog(cat, filter):Observable<Shop[]> {
    return this.http.get(this.config.API_SERVER + '/v1/shops/category/'+ cat, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as Shop[])
      .map(shops => shops.map(this.updateCache));
  };

  //
  // get a single shop
  get(urlpath):Observable<Shop> {
    return this.http.get(this.config.API_SERVER + '/v1/shops/' + urlpath, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as Shop)
      .map(this.updateCache)
      .do(this.shop$.next)
  };


  //
  // TODO: what is it used for ?
  publish(shop:Shop):Observable<Shop> {
    return this.http.get(this.config.API_SERVER + '/v1/shops/'+shop.urlpath+'/status' , {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as Shop)
      .map(this.updateCache)
      .do(this.shop$.next)
  };

  //
  // send question to a shop
  ask(shop:Shop,content:string):Observable<any> {
    return this.http.post(this.config.API_SERVER + '/v1/shops/'+shop.urlpath+'/status',
      {
        content:content
      }, {
      headers: this.headers,
      withCredentials: true
    });

  };

  save(shop:Shop):Observable<Shop>{
    return this.http.post(this.config.API_SERVER + '/v1/shops/'+shop.urlpath, shop, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as Shop)
      .map(this.updateCache)
      .do(this.shop$.next)
  };

  //
  // create a new shop for the current user
  // TODO: user must reload his profile when shop is modified
  create(shop:Shop):Observable<Shop>{
    return this.http.post(this.config.API_SERVER + '/v1/shops', shop, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as Shop)
      .map(this.updateCache)
      .do(this.shop$.next)
      // TODO shop.create => user.shops.push(shop);
  };

  //
  // delete shop for the current user
  // TODO: user must reload his profile when shop is modified
  remove(shop:Shop,password:string):Observable<any>{
      // TODO user.shops.pop(me);
      // TODO $rootScope.$broadcast("shop.remove",me);
    return this.http.delete(this.config.API_SERVER + '/v1/shops/'+ shop.urlpath, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as Shop)
      .map(this.deleteCache)
      // TODO what to callback on delete
      .do(()=>this.shop$.next(new Shop()))
  };

}
