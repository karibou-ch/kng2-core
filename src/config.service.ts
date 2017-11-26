import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map'

import { Config, config } from './config';



@Injectable()
export class ConfigService {

  public static defaultConfig={
    isAvailable:true,
    API_SERVER:'http://localhost:4000',

    API_VERSION:'/v1',

    LOG_LEVEL:'debug',

    AUTH_SUCCESS_REDIRECT_URL:'/',
    AUTH_ERROR_REDIRECT_URL:'/login',

    user:{
    },

    shared:{
    },
    loader:[],
    loginPath:['/admin', '/account'],
    readonlyPath:['/wallet/create'],
    avoidShopUIIn:['/admin', '/login', '/signup', '/content']

  };

  private headers: Headers;
  public config:Observable<Config>;

  constructor(
    public http: Http
  ) {
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');

      //.catch(err => Observable.of(new Config()));
  }


  init(): Observable<Config> {
    this.config = this.http.get(ConfigService.defaultConfig.API_SERVER + '/v1/config?lang=', {
      headers: this.headers,
      withCredentials: true,
    })
      .map(res => {
        Object.assign(config,ConfigService.defaultConfig)
        Object.assign(config.shared, res.json());
        return config;
      })
    return this.config;
  }

  static setDefaultConfig(settings:any){
    Object.assign(ConfigService.defaultConfig,settings);
  }

}
