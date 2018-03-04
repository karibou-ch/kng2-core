import { Http, Headers, RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { config } from './config';


import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { map, catchError } from 'rxjs/operators';
import 'rxjs/add/observable/of';

export class Document {
  private defaultDocument={
    title:{fr:'Titre', en:'Title'},
    header:{fr:'En tête', en:'Header'},
    content:{fr:'Contenu', en:'Content'},
    photo:{
      bundle:[]
    },
    available:false,
    published:false,
    skus:[],
    style:undefined,
    type: undefined
  }
  constructor(json?: any) {
    Object.assign(this, json||this.defaultDocument);
  }

  slug:string[];
  title:{
    fr:string;
    en:string;
  };
  header:{
    fr:string;
    en:string;
  };
  content:{
    fr:string;
    en:string;
  };
  photo:{
    header:string;
    bundle:string[];
  };
  deleted:boolean;
  available:boolean;
  published:boolean;
  skus:number[];
  style:string;
  signature:string;
  created:Date;
  type: string;
}

//
// Internal cache of request
// simple way to share instance between components
class Cache{
  list: Document[];
  map: Map<string, Document> //key is a slug
  constructor(){
    this.list=[];
    this.map=new Map();
  }
}

@Injectable()
export class DocumentService {
  //
  // common multicast to update UX when one shop on the list is modified
  // use it for singleton usage of category
  public  category$: ReplaySubject<Document>;

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

  private deleteCache(category: Document) {
      let incache=this.cache.map.get(category.slug);
      if (incache) {
          incache.deleted=true;
          this.cache.map.delete(category.slug);
      }
      return incache;
  }

  private updateCache(category: Document) {
    if(!this.cache.map.get(category.slug)){
        this.cache.map.set(category.slug,new Document(category))
        return this.cache.map.get(category.slug);
    }
    return Object.assign(this.cache.map.get(category.slug), category);
  }


  getCategories():string[] {
    if(!this.config.shared){
      return [];
    }
    return this.config.shared.document.types;
  }


  select(type: string):Observable<Document[]> {

    return this.http.get(this.config.API_SERVER + '/v1/documents/category/'+type, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => res.json().map(this.updateCache.bind(this)));
  }

  get(slug:string):Observable<Document> {
    // check if in the cache
    if (this.cache.map.get(slug)){
      return Observable.of(this.cache.map.get(slug));
    }

    return this.http.get(this.config.API_SERVER + '/v1/documents/'+slug, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => this.updateCache(res.json()))
  }

  //
  // all document already in cache
  loaded(type?:string):Document[]{
    let result:Document[]=[];
    this.cache.map.forEach((doc,slug)=>{
      if(doc.type==type||type===undefined){
        result.push(doc);
      }
    })
    return result;
  }

  save(slug:string, doc:Document):Observable<Document> {
    return this.http.post(this.config.API_SERVER + '/v1/documents/'+slug, doc, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => this.updateCache(res.json()))

  }

  create(doc: Document):Observable<Document> {
    return this.http.post(this.config.API_SERVER + '/v1/documents', doc, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => this.updateCache(res.json()))
  }

  remove(slug:string, password:string) {
    return this.http.put(this.config.API_SERVER + '/v1/documents/' + slug, {
      headers: this.headers,
      withCredentials: true,
      password:password
    })
    .map(res => this.deleteCache(res.json()))
  }


}
