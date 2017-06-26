import { Http, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { ConfigService } from './config.service'


export interface QueryFilter {
  stats?: boolean;
}

export class Category {
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

@Injectable()
export class CategoryService {
  // TODO make observable content !!
  config:any;

  private defaultCategory = {
    name: '',
    weight: 0,
    description: "",
    group: ""
  };
  

  private cache: {
    list: Category[];
    map: Map<string, Category>; //key is a slug
  }


  private updateCache(cat: Category) {
    if (this.cache.map[cat.slug])
      return Object.assign(this.cache.map[cat.slug], cat);
  }

  private deleteCache(cat: Category) {
    if (this.cache.map[cat.slug]) {
      this.cache.map.delete(cat.slug);
      let index = this.cache.list.indexOf(cat)
      if (index > -1)
        this.cache.list.splice(index, 1);
    }
  }

  private addCache(category:Category){
    //
    //check if already exist on cache and add in it if not the case
    if (!this.cache.map[category.slug]){
      this.cache.map[category.slug] = category;
      this.cache.list.push(category);
      return;
    }
    //update existing entry
    return Object.assign(this.cache.map[category.slug],category);    
  }

  private headers: Headers;

  constructor(
    private http: Http, 
    private configSrv: ConfigService
  ) {
    this.config=configSrv.config;    
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
    this.config = configSrv.config;
  }

  getCurrent() {
    throw new Error("Not implemented");
  };


  //slug -> "url-isation" of a string
  findNameBySlug(slug) {
    throw new Error("Already implemented");
    // var cat=this.find({slug:slug});
    // if (cat) {return cat.name;} else {return "Inconnu";}      
  };

  findBySlug(slug) {
    return this.cache.map[slug];
  };

  findByGroup(name) {
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
      .map(res => res.json() as Category[])
      .map(categories => categories.map(category=>this.addCache(category)));
    //.catch;
  }

  //get category based on his slug
  get(slug):Observable<Category> {
    let cached:Observable<Category>; //????

    // check if in the cache
    if (this.cache.map[slug]){
      return Observable.from(this.cache.map[slug]);
    }


    return this.http.get(this.config.API_SERVER + '/v1/category/'+slug, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as Category)
      .map(category => this.addCache(category))
      .catch(this.handleError);

  }


  //   app.post('/v1/category/:category', auth.ensureAdmin, categories.update);
  save(slug, cat:Category):Observable<Category> {
    //console.log("model",this.photo)
    
    return this.http.post(this.config.API_SERVER + '/v1/category/'+slug, cat, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => res.json() as Category)
    .catch(this.handleError);

  }

//  app.post('/v1/category', auth.ensureAdmin, categories.create);
  create(cat: Category):Observable<Category> {

    return this.http.post(this.config.API_SERVER + '/v1/category/', cat, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => res.json() as Category)
    .map(category => this.addCache(category))
    .catch(this.handleError);
    /*
    if (!err) { err = function () { }; }
    var category = this, s = this.backend.save(cat, function () {
      category = category.wrap(s);
      if (cb) { cb(category); }
    }, err);
    return category;
    */
  }

//  app.put('/v1/category/:category', auth.ensureAdmin, auth.checkPassword, categories.remove);
  remove(slug, password) {
    return this.http.put(this.config.API_SERVER + '/v1/category/' + slug, {
      headers: this.headers,
      withCredentials: true,
      password:password
    })
    .map(res => res.json() as Category)
    .map(cat => this.deleteCache(cat))
    .catch(this.handleError);
  }


  private handleError (error: Response | any) {
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
