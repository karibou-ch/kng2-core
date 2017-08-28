import { Http, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs/Rx';
import { config } from './config';


export class Category {

  constructor(json?: any) {
      Object.assign(this, json);
    } else {
      let defaultCat = {
      slug: '',
      group: '',
      cover: '',
      description: '',
      image: '',
      name: '',
      type: '',
      home: false,
      active: false,
    }
    Object.assign(this, defaultCat);
  }
}

  slug: string;
  group: string;  /* permet de grouper une catégorie (toutes les catégories des artisans, producteurs*/
  _id;
  cover: string;  /* image de la catégorie */
  description: string;
  image: string; /* icon associé à la catégorie */
  name: string;
  weight; /*permet d'ordonner les cat les plus légère en haut */
  type: string;
  home: boolean; /* afficher une sélection de cat sur la home */
  active: boolean;

}

//
// Internal cache of request
// TODO check if ServiceWorker is the best solution for caching JSON request
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

  private defaultCategory = {
    name: '',
    weight: 0,
    description: "",
    group: ""
  };


  private cache:Cache=new Cache();
  private headers: Headers;

  constructor(
    private http: Http
    ) {
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
    this.config = config;
  }

  private deleteCache(cat: Category) {
    if (this.cache.map[cat.slug]) {
      this.cache.map.delete(cat.slug);
      let index = this.cache.list.indexOf(cat)
      if (index > -1)
        this.cache.list.splice(index, 1);
    }
  }

  private updateCache(category:Category){

    //check if already exist on cache and add in it if not the case
    if (!this.cache.map[category.slug]){
      this.cache.map[category.slug] = category;
      this.cache.list.push(category);
      return category;
    }
    //update existing entry
    return Object.assign(this.cache.map[category.slug],category);
    //return category;
  }


  getCurrent() {
    throw new Error("Not implemented");
  };


  //
  // retourne le Nom de la catégorie ou un message d'erreur
  findNameBySlug(slug):Observable<string> {
    return this.get(slug)
      .map(c=>c.name)
      // TODO manage i18n
      .catch(err=>"Catégorie Inconnue")
  };

  findBySlug(slug):Observable<Category> {
    return this.get(slug)
  };

  findByGroup(name):Category[] {
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
      .map(res => res.json().map(obj => new Category(obj)))
      .map(categories => categories.map(this.updateCache.bind(this)))
      .catch(this.handleError);
  }

  //get category based on his slug
  get(slug):Observable<Category> {
    // check if in the cache
    if (this.cache.map[slug]){
      return Observable.of(this.cache.map[slug]);
    }

    return this.http.get(this.config.API_SERVER + '/v1/category/'+slug, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json().map(obj => new Category(obj)))
      .map(this.updateCache)
      //TODO should run next here!
      //.do(this.category$.next)
      .catch(this.handleError);

  }


  //   app.post('/v1/category/:category', auth.ensureAdmin, categories.update);
  save(slug, cat:Category):Observable<Category> {

    return this.http.post(this.config.API_SERVER + '/v1/category/'+slug, cat, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res  => new Category(res.json))
    .map(this.updateCache)
    //TODO should run next here!
    //.do(this.category$.next)
    .catch(this.handleError);

  }

//  app.post('/v1/category', auth.ensureAdmin, categories.create);
  create(cat: Category):Observable<Category> {
    return this.http.post(this.config.API_SERVER + '/v1/category', cat, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res  => new Category(res.json))
    .map(this.updateCache)
    // .do(this.category$.next)
    .catch(this.handleError);
  }

//  app.put('/v1/category/:category', auth.ensureAdmin, auth.checkPassword, categories.remove);
  remove(slug, password) {
    return this.http.put(this.config.API_SERVER + '/v1/category/' + slug, {
      headers: this.headers,
      withCredentials: true,
      password:password
    })
    .map(res  => new Category(res.json))
    .do(this.category$.next)
    .map(this.deleteCache)
    .catch(this.handleError);
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
    console.error(errMsg);
    return Observable.throw(errMsg);
  }

}
