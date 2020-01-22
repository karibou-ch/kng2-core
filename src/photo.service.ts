import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Config, config, ConfigKeyStoreEnum } from './config';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

export class Photo {
  // TO DO TSLINT
  constructor(json) {
}
  public slug: string;
  public url: string;
}

@Injectable()
export class PhotoService {
  private headers: HttpHeaders;
  public config: any;

  constructor(
    private http: HttpClient
  ) {

    this.config = config;
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
  }

  //
  // load shops photos
  public shops(criteria): Observable<Photo[]> {
    const params: any = {
      active: criteria.active || false
    };

    if (criteria.slugs) {
      params.slugs = criteria.slugs;
    }
    if (criteria.random) {
      params.random = criteria.random;
    }

    return this.http.get<Photo[]>(config.API_SERVER + '/v1/shops/photos', {
      params,
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map((photos: any[]) => {
        return photos;
      })
    );
  }

  //
  // load shops photos
  public products(criteria): Observable<Photo[]> {
    const params: any = {
      active: criteria.active || false
    };

    if (criteria.skus) {
      params.skus = criteria.skus;
    }
    if (criteria.random) {
      params.random = criteria.random;
    }
    return this.http.get<Photo[]>(config.API_SERVER + '/v1/products/photos', {
      params,
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map((photos: any[]) => {
        return photos;
      })
    );
  }

}
