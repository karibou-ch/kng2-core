import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { config } from './config';
import { Utils } from './util';

import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { _throw } from 'rxjs/observable/throw';
import { of } from 'rxjs/observable/of';
import { map, catchError } from 'rxjs/operators';

export class Category {
  constructor(json?: any) {
    const defaultCategory = {
      tags: [],
      usedBy: [],
      weight: 0,
      child: []
    };

    Object.assign(this, Utils.merge(defaultCategory, json || {}));
  }
  public deleted: boolean;
  public _id: string;
  public slug: string;
  public group: string;  /* permet de grouper une catégorie (toutes les catégories des artisans, producteurs*/
  public cover: string;  /* image de la catégorie */
  public description?: string;
  public image: string; /* icon associé à la catégorie */
  public name: string;
  public weight: number; /*permet d'ordonner les cat les plus légère en haut */
  public type: string;
  public home: boolean; /* afficher une sélection de cat sur la home */
  public active: boolean;
  public usedBy?: number[];
  public tags: string[];
  // TODO TSLINT
  // Array type using 'T[]' is forbidden for non-simple types. Use 'Array<T>' instead. (array-type)
  public child: {
    name: string;
    weight: number;
  }[];
}

//
// Internal cache of request
// simple way to share instance between components
class Cache {
  public list: Category[];
  public map: Map<string, Category>; // key is a slug
  constructor() {
    this.list = [];
    this.map = new Map();
  }
}

@Injectable()
export class CategoryService {
  //
  // common multicast to update UX when one shop on the list is modified
  // use it for singleton usage of category
  public  category$: ReplaySubject<Category>;

  public config: any;

  private cache: Cache = new Cache();
  private headers: HttpHeaders;

  constructor(
    private http: HttpClient
    ) {
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.config = config;
  }

  private deleteCache(slug: string) {
      const incache = this.cache.map.get(slug);
      if (incache) {
          incache.deleted = true;
          this.cache.map.delete(slug);
      }
      return incache;
  }

  private updateCache(category: Category) {
    if (!this.cache.map.get(category.slug)) {
        this.cache.map.set(category.slug, new Category(category));
        return this.cache.map.get(category.slug);
    }
    return Object.assign(this.cache.map.get(category.slug), category);
  }

  public getCurrent() {
    throw new Error('Not implemented');
  }

  //
  // retourne le Nom de la catégorie ou un message d'erreur
  public findNameBySlug(slug: string): Observable<string> {
    return this.get(slug).pipe(
      map((c) => c.name),
      catchError((err) => of('Catégorie Inconnue'))
    );
  }

  public findBySlug(slug: string): Observable<Category> {
    return this.get(slug);
  }

  public findByGroup(name: string): Category[] {
    // TODO load if `this.cache.list` is empty?
    return this.cache.list.filter((category) => category.group === name);
  }

  // request categories with filter
  public select(filter?: any): Observable<Category[]> {
    filter = filter || {};

    return this.http.get<Category[]>(this.config.API_SERVER + '/v1/category', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((categories) => categories.map(this.updateCache.bind(this)))
    );
  }

  // get category based on his slug
  public get(slug: string): Observable<Category> {
    // check if in the cache
    if (this.cache.map.get(slug)) {
      return of(this.cache.map.get(slug));
    }

    return this.http.get<Category>(this.config.API_SERVER + '/v1/category/' + slug, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((cat) => this.updateCache(cat))
    );
  }

  //   app.post('/v1/category/:category', auth.ensureAdmin, categories.update);
  public save(slug: string, cat: Category): Observable<Category> {

    return this.http.post<Category>(this.config.API_SERVER + '/v1/category/' + slug, cat, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((cat) => this.updateCache(cat))
    );

  }

//  app.post<Category>('/v1/category', auth.ensureAdmin, categories.create);
  public create(cat: Category): Observable<Category> {
    return this.http.post<Category>(this.config.API_SERVER + '/v1/category', cat, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((cat) => this.updateCache(cat))
    );
  }

//  app.put('/v1/category/:category', auth.ensureAdmin, auth.checkPassword, categories.remove);
  public remove(slug: string, password: string) {
    return this.http.put(this.config.API_SERVER + '/v1/category/' + slug, {password}, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((result) => this.deleteCache(slug))
    );
  }

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
  }

}
