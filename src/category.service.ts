import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { config, configCors } from './config';
import { Utils } from './util';


import { ReplaySubject ,  Observable ,  throwError as _throw ,  of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AnalyticsService } from './metrics.service';


export class Category {
  constructor(json?: any) {
    let defaultCategory={
      tags:[],
      usedBy:[],
      weight:0,
      child:[]
    }
  
    Object.assign(this, Utils.merge(defaultCategory,json||{}));          
  }
  deleted:boolean;
  _id:string;
  slug: string;
  group: string;  /* permet de grouper une catégorie (toutes les catégories des artisans, producteurs*/
  cover: string;  /* image de la catégorie */
  color: string;  /* couleur de la catégorie */
  description?: string;
  image: string; /* icon associé à la catégorie */
  name: string;
  weight:number; /*permet d'ordonner les cat les plus légère en haut */
  type: string;
  home: boolean; /* afficher une sélection de cat sur la home */
  active: boolean;
  usedBy?:number[];
  tags:string[];
  child:{
    name:string;
    weight:number;
  }[];
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
  public  categories$: BehaviorSubject<Category[]> | ReplaySubject<Category[]>;

  config: any;


  private cache: Cache = new Cache();
  private headers: HttpHeaders;

  constructor(
    private http: HttpClient
    ) {
      this.headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Cache-Control' : 'no-cache',
        'Pragma' : 'no-cache',
        'ngsw-bypass':'true',
        'k-dbg': AnalyticsService.FBP
      });
      this.config = config;

    // this.category$ = new ReplaySubject(1);
    this.categories$ = new BehaviorSubject<Category[]>(null);
  }

  private deleteCache(slug: string): Category {
      const incache = this.cache.map.get(slug);
      if (incache) {
          incache.deleted = true;
          this.cache.map.delete(slug);
      }
      return incache;
  }

  private updateCache(category: Category): Category {
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
    return this.get(slug).pipe(
      map(c=>c.name),
      catchError(err=>of("Catégorie Inconnue"))
    );
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

    return this.http.get<Category[]>(this.config.API_SERVER + '/v1/category', {
      params: filter,
      headers: this.headers,
    }).pipe(
      map(categories => categories.map(this.updateCache.bind(this)) as Category[]),
      tap(categories => {
        this.categories$.next(categories);
        return categories;
      })
    );
  }

  //get category based on his slug
  get(slug:string):Observable<Category> {
    // check if in the cache
    if (this.cache.map.get(slug)){
      return of(this.cache.map.get(slug));
    }
    return this.http.get<Category>(this.config.API_SERVER + '/v1/category/'+slug, {
      headers: this.headers,
    }).pipe(
      map(cat => this.updateCache(cat))
    );
  }


  //   app.post('/v1/category/:category', auth.ensureAdmin, categories.update);
  save(slug:string, cat:Category):Observable<Category> {
    return this.http.post<Category>(this.config.API_SERVER + '/v1/category/'+slug, cat, {
      headers: this.headers,
      withCredentials:true
    }).pipe(
      map(cat => this.updateCache(cat))
    );

  }

//  app.post<Category>('/v1/category', auth.ensureAdmin, categories.create);
  create(cat: Category):Observable<Category> {
    return this.http.post<Category>(this.config.API_SERVER + '/v1/category', cat, {
      headers: this.headers,
      withCredentials:true
    }).pipe(
      map(cat => this.updateCache(cat))
    );
  }

//  app.put('/v1/category/:category', auth.ensureAdmin, auth.checkPassword, categories.remove);
  remove(slug:string, password:string) {
    return this.http.put(this.config.API_SERVER + '/v1/category/' + slug,{password:password}, {
      headers: this.headers,
      withCredentials:true
    }).pipe(
      map(result => this.deleteCache(slug))
    );
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
    return _throw(errMsg);
  }

}
