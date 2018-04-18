import { Http, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { config } from './config';
import { Utils } from './util';


import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { map, catchError } from 'rxjs/operators';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';


export class Category {
  private defaultCategory={
    tags:[],
    weight:0
  }
  constructor(json?: any) {
    Object.assign(this, Utils.merge(this.defaultCategory,json||{}));          
  }
  deleted:boolean;
  _id:string;
  slug: string;
  group: string;  /* permet de grouper une catégorie (toutes les catégories des artisans, producteurs*/
  cover: string;  /* image de la catégorie */
  description?: string;
  image: string; /* icon associé à la catégorie */
  name: string;
  weight:number; /*permet d'ordonner les cat les plus légère en haut */
  type: string;
  home: boolean; /* afficher une sélection de cat sur la home */
  active: boolean;
  usedBy?:number[];
  tags:string[]
}

//
// Internal cache of request
// simple way to share instance between components
class Cache{
  list: Category[];
  map: Map<string, Category> //key is a slug
  constructor(){
    this.list=[];
    this.map=new Map();
  }
}

@Injectable()
export class CategoryService {
  //
  // common multicast to update UX when one shop on the list is modified
  // use it for singleton usage of category
  public  category$: ReplaySubject<Category>;

  config:any;


  private cache:Cache=new Cache();
  private headers: Headers;

  constructor(
    private http: Http
    ) {
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
    this.config = config;
  }

  private deleteCache(slug: string) {
      let incache=this.cache.map.get(slug);
      if (incache) {
          incache.deleted=true;
          this.cache.map.delete(slug);
      }
      return incache;
  }

  private updateCache(category: Category) {
    if(!this.cache.map.get(category.slug)){
        this.cache.map.set(category.slug,new Category(category))
        return this.cache.map.get(category.slug);
    }
    return Object.assign(this.cache.map.get(category.slug), category);
  }


  getCurrent() {
    throw new Error("Not implemented");
  };


  //
  // retourne le Nom de la catégorie ou un message d'erreur
  findNameBySlug(slug:string):Observable<string> {
    return this.get(slug)
      .map(c=>c.name)
      // TODO manage i18n
      .catch(err=>"Catégorie Inconnue")
  };

  findBySlug(slug:string):Observable<Category> {
    return this.get(slug)
  };

  findByGroup(name:string):Category[] {
    // TODO load if `this.cache.list` is empty?
    return this.cache.list.filter(category => category.group === name);
  }

  // request categories with filter
  select(filter?: any):Observable<Category[]> {
    filter = filter || {};

    return this.http.get(this.config.API_SERVER + '/v1/category', {
      search: filter,
      headers: this.headers,
      withCredentials: true
    })
    .map(res => res.json().map(this.updateCache.bind(this)));
  }

  //get category based on his slug
  get(slug:string):Observable<Category> {
    // check if in the cache
    if (this.cache.map.get(slug)){
      return Observable.of(this.cache.map.get(slug));
    }

    return this.http.get(this.config.API_SERVER + '/v1/category/'+slug, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => this.updateCache(res.json()))
  }


  //   app.post('/v1/category/:category', auth.ensureAdmin, categories.update);
  save(slug:string, cat:Category):Observable<Category> {

    return this.http.post(this.config.API_SERVER + '/v1/category/'+slug, cat, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => this.updateCache(res.json()))

  }

//  app.post('/v1/category', auth.ensureAdmin, categories.create);
  create(cat: Category):Observable<Category> {
    return this.http.post(this.config.API_SERVER + '/v1/category', cat, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => this.updateCache(res.json()))
  }

//  app.put('/v1/category/:category', auth.ensureAdmin, auth.checkPassword, categories.remove);
  remove(slug:string, password:string) {
    return this.http.put(this.config.API_SERVER + '/v1/category/' + slug,{password:password}, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => this.deleteCache(slug))
  }


  private handleError (error: Response | any) {
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
    return Observable.throw(errMsg);
  }

}
