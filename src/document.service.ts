import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { config } from './config';

import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators';
import { StaticInjector } from '@angular/core/src/di/injector';

export class Document implements DocumentHeader {
  constructor(json?: any) {
    const defaultDocument = {
      title: {},
      header: {},
      content: {},
      photo: {
        bundle: []
      },
      created: new Date(),
      available: false,
      published: false,
      skus: [],
      style: undefined,
      signature: undefined,
      type: undefined
    };

    Object.assign(this, json || defaultDocument);
  }

  public slug: string[];
  public title: {
    fr: string;
    en: string;
  };
  public header: {
    fr: string;
    en: string;
  };
  public content: {
    fr: string;
    en: string;
  };
  public photo: {
    header: string;
    bundle: string[];
  };
  public deleted: boolean;
  public available: boolean;
  public published: boolean;
  public skus: number[];
  public style: string;
  public signature: string;
  public created: Date;
  public type: string;
}

export interface DocumentHeader {
  slug: string[];
  title: {fr: string, en: string};
  available: boolean;
  published: boolean;
  signature: string;
}

//
// Internal cache of request
// simple way to share instance between components
class Cache {
  public list: Document[];
  public map: Map<string, Document>; // key is a slug
  constructor() {
    this.list = [];
    this.map = new Map();
  }
}

@Injectable()
export class DocumentService {
  //
  // common multicast to update UX when one shop on the list is modified
  // use it for singleton usage of category
  public  category$: ReplaySubject<Document>;

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

  private updateCache(doc: Document) {
    if (!this.cache.map.get(doc.slug[0])) {
        this.cache.map.set(doc.slug[0], new Document(doc));
        return this.cache.map.get(doc.slug[0]);
    }
    return Object.assign(this.cache.map.get(doc.slug[0]), doc);
  }

  public getCategories(): string[] {
    if (!this.config.shared) {
      return [];
    }
    return this.config.shared.document.types;
  }

  public select(type: string, headersOnly?: boolean): Observable<Document[]> {
    const params: any = {};
    if (headersOnly) {
      params.headerOnly = 'true';
    }
    return this.http.get<Document[]>(this.config.API_SERVER + '/v1/documents/category/' + type, {
      params,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((documents) => documents.map(this.updateCache.bind(this)))
    );
  }

  public get(slug: string): Observable<Document> {
    // check if in the cache
    if (this.cache.map.get(slug)) {
      return of(this.cache.map.get(slug));
    }

    return this.http.get<Document>(this.config.API_SERVER + '/v1/documents/' + slug, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((doc) => this.updateCache(doc))
    );
  }

  public getAll(headersOnly?: boolean): Observable<DocumentHeader[]> {
    const params: any = {};
    if (headersOnly) {
      params.headerOnly = 'true';
    }

    return this.http.get<DocumentHeader[]>(this.config.API_SERVER + '/v1/documents', {
      params,
      headers: this.headers,
      withCredentials: true
    });
  }
  //
  // all document already in cache
  public loaded(type?: string): Document[] {
    const result: Document[] = [];
    this.cache.map.forEach((doc, slug) => {
      if (doc.type === type || type === undefined) {
        result.push(doc);
      }
    });
    return result;
  }

  public save(slug: string, doc: Document): Observable<Document> {
    return this.http.post<Document>(this.config.API_SERVER + '/v1/documents/' + slug, doc, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((doc) => this.updateCache(doc))
    );

  }

  public create(doc: Document): Observable<Document> {
    return this.http.post<Document>(this.config.API_SERVER + '/v1/documents', doc, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((doc) => this.updateCache(doc))
    );
  }

  public remove(slug: string, password?: string) {
    return this.http.put<Document>(this.config.API_SERVER + '/v1/documents/' + slug, {password}, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((doc) => this.deleteCache(slug))
    );
  }

}
