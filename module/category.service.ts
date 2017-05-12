import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { ConfigService } from './config.service'


export interface QueryFilter {
  stats?: boolean;
}

export class Category {
  slug: string;
  group: string;

}

@Injectable()
export class CategoryService {

  private defaultCategory = {
    name: '',
    weight: 0,
    description: "",
    group: ""
  };

  //
  // 
  private cache: {
    list: Category[];
    map: Map<string, Category>; //key is a slug
  }
  private updateCache(category:Category){

  }

  private deleteCache(category:Category){

  }

  private addCache(category:Category){
    //
    //check if already exist on cache and add in it if not the case
    if (!this.cache.map[category.slug]){
      this.cache.map[category.slug] = category;
      this.cache.list.push(category);
      return;
    }
    return Object.assign(this.cache.map[category.slug],category);    
  }

  private headers: Headers;

  constructor(private http: Http, private config: ConfigService) {
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
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


  // request with filter
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

  //get c
  get(slug):Observable<Category> {
    let cached:Observable<Category>;

    // vérifie si dans le cache
    if (this.cache.map[slug]){
      return Observable.from(this.cache.map[slug]);
    }


    this.http.get(this.config.API_SERVER + '/v1/category/'+slug, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as Category)
      .map(category => this.addCache(category));

    //   var loaded=Category.find({slug:slug});if (loaded){
    //     if(cb){cb(loaded);}
    //     return loaded;
    //   }

    //   var category=this, c=this.backend.get({category:slug},function() {
    //     //wrap = as Category
    //     category.wrap(s);
    //     if(cb){cb(category);}
    //   },err);
    //   return category;


  }


  // avec POST
  save(cb, err) {
    //console.log("model",this.photo)

/*
    if (!err) { err = onerr; }
    var category = this, s = this.backend.save({ category: this.slug }, this, function () {
      category.wrap(s);
      if (cb) { cb(category); }
    }, err);
    return category;
    */
  };

  create(cat, cb, err) {
    if (!err) { err = function () { }; }
    var category = this, s = this.backend.save(cat, function () {
      category = category.wrap(s);
      if (cb) { cb(category); }
    }, err);
    return category;
  };

  remove(password, cb, err) {
    if (!err) { err = function () { }; }
    var category = this, s = this.backend.delete({ category: this.slug }, { password: password }, function () {
      if (cb) { cb(category); }
    }, err);
    return category;
  };


}