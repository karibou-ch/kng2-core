import { Http, Headers } from '@angular/http';
import { Injectable, Inject } from '@angular/core';

import { Config, config, ConfigKeyStoreEnum } from './config';


import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
//import { map } from 'rxjs/operators';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/mergeMap';
import { ISubscription } from 'rxjs/Subscription';





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
      token:'Zz7YkTpPPp5YFQnCprtc7O9'
    },
    loader:[],
    loginPath:['/admin', '/account'],
    readonlyPath:['/wallet/create'],
    avoidShopUIIn:['/admin', '/login', '/signup', '/content']

  };

  private defaultHome:any={
    shop:{
      h:{fr:null,en:null,de:null},
      p:{fr:null,en:null,de:null},
    },
    howto:{
      h:{fr:null,en:null,de:null},
      t:{fr:null,en:null,de:null},
      p:{fr:null,en:null,de:null},
    },
    about:{
      h:{fr:null,en:null,de:null},
      t:{fr:null,en:null,de:null},
      p:{fr:null,en:null,de:null},
    },
    tagLine:{
      h:{fr:null,en:null,de:null},
      p:{fr:null,en:null,de:null},
    },
    footer:{
      h:{fr:null,en:null,de:null},
      p:{fr:null,en:null,de:null},
    },    
  }

  private headers: Headers;
  public config:Observable<Config>;
  private config$: ReplaySubject<Config>;

  constructor(
    @Inject('KNG2_OPTIONS') private customConfig:any,
    private http: Http
  ) {
    Object.assign(ConfigService.defaultConfig,customConfig||{});
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
    this.config$ = new ReplaySubject<Config>(1);



  }


  init(): Observable<Config> {
    let lang=this.locale;
    this.config = this.http.get(ConfigService.defaultConfig.API_SERVER + '/v1/config?lang='+lang, {
      headers: this.headers,
      withCredentials: true,
    })
      .map(res => {
        Object.assign(config,ConfigService.defaultConfig)
        Object.assign(config.shared, res.json());
        Object.assign(this.defaultHome.about,config.shared.home.about);
        Object.assign(this.defaultHome.howto,config.shared.home.howto);
        Object.assign(this.defaultHome.shop,config.shared.home.shop);
        Object.assign(this.defaultHome.tagLine,config.shared.home.tagLine);
        Object.assign(this.defaultHome.footer,config.shared.home.footer);
        Object.assign(config.shared.home,this.defaultHome)
          
        return config;
      })
    return this.config;
  }



  // $scope.menuSplice=function (lst, menu) {
  //   for (var i = lst.length - 1; i >= 0; i--) {
  //     if(lst[i].name===menu.name){
  //       lst.splice(i, 1);
  //     }
  //   }
  // };  

  save(config:Config,cid?:string):Observable<any>{    
    return this.http.post(ConfigService.defaultConfig.API_SERVER + '/v1/config',config.shared, {
      headers: this.headers,
      withCredentials: true
    })
    .map(res => {
      Object.assign(config,ConfigService.defaultConfig)
      Object.assign(config.shared, res.json());
      Object.assign(this.defaultHome.about,config.shared.home.about);
      Object.assign(this.defaultHome.howto,config.shared.home.howto);
      Object.assign(this.defaultHome.shop,config.shared.home.shop);
      Object.assign(this.defaultHome.tagLine,config.shared.home.tagLine);
      Object.assign(this.defaultHome.footer,config.shared.home.footer);
      Object.assign(config.shared.home,this.defaultHome)
      return config;
    })
    .do(config=>this.config$.next(config));
  }


  //
  // TODO wait for angular to fix i18n issue (runtime switch)
  // - http://www.ngx-translate.com/ (for dynamic AOT issue?)
  // - https://github.com/angular/angular/issues/11405 (for in ts translation)
  // - https://angular.io/guide/i18n (for static translation AOT compatible!)
  // - https://medium.com/@feloy/deploying-an-i18n-angular-app-with-angular-cli-fc788f17e358 (build locale targets)
  //   +--> https://github.com/ngx-translate/core/issues/495 (plan to integrate runtime lang switch and keep AOT compliant)
  set locale(lang:string){
    localStorage.setItem('localeId', lang);
    this.http.get(config.API_SERVER+'/v1/config?lang='+lang);    
  }

  get locale(){
    // FIXME default locale should not be hardcoded!
    let lang = localStorage.getItem('localeId')||navigator.language || navigator['userLanguage']||'fr'; 
    return lang;
  }

  /**
   * Subscribe to the user stream.
   */
  subscribe(
    onNext, onThrow?: ((exception: any) => void)|null,
    onReturn?: (() => void)|null): ISubscription {
      return this.config$.subscribe({next: onNext, error: onThrow, complete: onReturn});
  }  

}
