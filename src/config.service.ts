import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Config, config, ConfigKeyStoreEnum } from './config';
import { UserAddress, DepositAddress } from './user.service';


import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { map, tap } from 'rxjs/operators';
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

  //
  // FIXME this should be managed by server side
  private defaultHome:any={
    shop:{
      t:{fr:null,en:null,de:null},
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
      t:{fr:null,en:null,de:null},
      h:{fr:null,en:null,de:null},
      p:{fr:null,en:null,de:null},
    },
    footer:{
      t:{fr:null,en:null,de:null},
      h:{fr:null,en:null,de:null},
      p:{fr:null,en:null,de:null},
    },    
  }

  private headers: HttpHeaders;
  public config:Observable<Config>;
  public config$: ReplaySubject<Config>;

  constructor(
    @Inject('KNG2_OPTIONS') private customConfig:any,
    private http: HttpClient
  ) {
    Object.assign(ConfigService.defaultConfig,customConfig||{});
    // FIXME, remove this hugly config propagation
    Object.assign(config,customConfig||{});
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.config$ = new ReplaySubject<Config>(1);
  }


  get(): Observable<Config> {
    let lang=this.locale;
    this.config = this.http.get<any>(ConfigService.defaultConfig.API_SERVER + '/v1/config?lang='+lang, {
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map(shared => {
        Object.assign(config,ConfigService.defaultConfig)
        Object.assign(config.shared, shared);

        //
        // dates 
        config.shared.shippingweek=(shared.shippingweek||[]).map(date=>new Date(date));
          
        //
        // deposit
        config.shared.deposits=(config.shared.deposits||[]).map(deposit=>new DepositAddress(
          deposit.name,
          deposit.streetAddress||deposit.streetAdress,
          deposit.floor,
          deposit.region,
          deposit.postalCode,
          deposit.note,
          deposit.geo,
          deposit.weight,
          deposit.active,
          deposit.fees
        ));
        return config;
      })
    )
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
    return this.http.post<any>(ConfigService.defaultConfig.API_SERVER + '/v1/config',config.shared, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(shared => {
        Object.assign(config,ConfigService.defaultConfig)
        Object.assign(config.shared, shared);
        
        //
        // dates 
        config.shared.shippingweek=(shared.shippingweek||[]).map(date=>new Date(date));
        //
        // deposit
        config.shared.deposits=(config.shared.deposits||[]).map(deposit=>new DepositAddress(
          deposit.name,
          deposit.streetAddress||deposit.streetAdress,
          deposit.floor,
          deposit.region,
          deposit.postalCode,
          deposit.note,
          deposit.geo,
          deposit.weight,
          deposit.active,
          deposit.fees
        ));
        
        return config;
      }),
      tap(config=>this.config$.next(config))
    );
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
