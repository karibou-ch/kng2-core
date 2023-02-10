import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Config, config, ConfigKeyStoreEnum } from './config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


export class Photo {
  constructor(json) {
    
  }
  slug:string;
  url:string;
}


@Injectable()
export class PhotoService {
  private headers: HttpHeaders;
  public config:any;

  constructor(
    private http: HttpClient
  ) {
    

    this.config = config;
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control' : 'no-cache',
      'Pragma' : 'no-cache',
      'ngsw-bypass':'true'
    });
  }


  //
  // load shops photos
  shops(criteria): Observable<Photo[]> {
    let params:any={
      active:criteria.active||false
    };

    if(criteria.slugs){
      params.slugs=criteria.slugs;
    }
    if(criteria.random){
      params.random=criteria.random;
    }

    return this.http.get<Photo[]>(config.API_SERVER + '/v1/shops/photos', {
      params:params,
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map((photos:any[]) => {
        return photos;
      })
    )
  }

  //
  // load shops photos
  products(criteria): Observable<Photo[]> {
    let params:any={
      active:criteria.active||false
    };
    
    if(criteria.skus){
      params.skus=criteria.skus;
    }
    if(criteria.random){
      params.random=criteria.random;
    }
    return this.http.get<Photo[]>(config.API_SERVER + '/v1/products/photos', {
      params:params,
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map((photos:any[]) => {
        return photos;
      })
    )
  }

}
