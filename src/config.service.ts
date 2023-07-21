import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Config, config } from './config';
import { DepositAddress } from './user.service';


// import { _throw } from 'rxjs/observable/throw';
import { Observable } from 'rxjs';
// import { of } from 'rxjs/observable/of';
import { ReplaySubject } from 'rxjs';
import { map, tap, retryWhen, delay, take, distinctUntilChanged } from 'rxjs/operators';


@Injectable()
export class ConfigService {

  public static defaultConfig = {
    isAvailable: true,
    API_SERVER: 'http://localhost:4000',

    API_VERSION: '/v1',

    LOG_LEVEL: 'debug',

    AUTH_SUCCESS_REDIRECT_URL: '/',
    AUTH_ERROR_REDIRECT_URL: '/login',

    user: {
    },

    shared: {
    },
    loader: [],
    loginPath: ['/admin', '/account'],
    readonlyPath: ['/wallet/create'],
    avoidShopUIIn: ['/admin', '/login', '/signup', '/content']

  };

  private headers: HttpHeaders;
  public config: Observable<Config>;
  public config$: ReplaySubject<Config>;

  constructor(
    @Inject('KNG2_OPTIONS') private customConfig: any,
    private http: HttpClient
  ) {

    //
    // Use dynamic server settings
    if (!customConfig.API_SERVER) {
      // customConfig.API_SERVER = ('//api.' + window.location.hostname);
      customConfig.API_SERVER = ('//' + window.location.hostname + '/api');
    }


    Object.assign(ConfigService.defaultConfig, customConfig || {});
    // FIXME, remove this hugly config propagation
    Object.assign(config, customConfig || {});


    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control' : 'no-cache',
      'Pragma' : 'no-cache',
      'ngsw-bypass':'true'
    });
    //
    // ReplaySubject IFF disctinct config
    this.config$ = new ReplaySubject<Config>(1);    
    this.config$.pipe(distinctUntilChanged((prev, curr) => {
      const ps = prev.shared;
      const cs = curr.shared;
      console.log(cs.timestamp,cs.hub && cs.hub.update)
      if(ps.timestamp !== cs.timestamp){
        return true;
      }
      if(cs.hub !== ps.hub) {
        return true
      }
      if(cs.hub && ps.hub && cs.hub.updated !== ps.hub.updated){
        return true;
      }
      return false;        
    }));
  }


  get(hub?: string): Observable<Config> {
    const params: any = { lang: this.locale };
    hub && (params.hub = hub);
    this.config = this.http.get<any>(ConfigService.defaultConfig.API_SERVER + '/v1/config', {
      headers: this.headers,
      withCredentials: true,
      params: (params)
    }).pipe(
      retryWhen(errors => errors.pipe(delay(1000), take(3))),
      map((shared: any) => {
        //
        // based on server timestamp, previous config is more recent
        // console.log('--DEBUG cfg local', config.shared.timestamp, config.shared.hub);
        // console.log('--DEBUG cfg serve', shared.timestamp, shared.hub);
        // if (config.shared.timestamp > shared.timestamp) {
        const sharedHasHUB = shared.hub && shared.hub.name;
        const localHasHub = config.shared.hub && config.shared.hub.slug;
        if (localHasHub &&
           !sharedHasHUB) {
            return config;
        }
        Object.assign(config, ConfigService.defaultConfig);
        Object.assign(config.shared, shared);

        //
        // fill dates
        config.shared.shippingweek = (shared.shippingweek || []).map(date => new Date(date));

        //
        // HUB extension
        if (config.shared.hub) {

          const initNoShippping = noshipping => {
            noshipping.from = new Date(noshipping.from);
            noshipping.to = new Date(noshipping.to);
          };
          config.shared.hub.noshipping = config.shared.hub.noshipping || [];
          config.shared.hub.noshipping.forEach(initNoShippping);

          config.shared.hubs.forEach(hub => {
            hub.noshipping.forEach(initNoShippping);
          });


          const initDeposit = deposit => new DepositAddress(
            deposit.name,
            deposit.streetAddress || deposit.streetAdress,
            deposit.floor,
            deposit.region,
            deposit.postalCode,
            deposit.note,
            deposit.geo,
            deposit.weight,
            deposit.active,
            deposit.fees
          );

          //
          // deposits
          config.shared.hub.deposits = (config.shared.hub.deposits || []).map(initDeposit);
          config.shared.hubs.forEach(hub => {
            hub.deposits = (hub.deposits||[]).map(initDeposit);
          })
        }

        config.shared.faq = config.shared.faq || [];
        config.shared.faq_title = config.shared.faq_title || {en:"",fr:""};
        return config;
      }),
      tap(config => {
        this.config$.next(config);
        return config;
      })
    );
    return this.config;
  }


  setServer(url: string) {
    if (!url) {
      throw new Error('set server url is Null');
    }
    ConfigService.defaultConfig.API_SERVER = url;
    //
    // TODO save url to the localStorage AND use it on load
  }

  save(config: Config, cid?: string): Observable<any> {
    const hub = config.shared.hub;
    delete config.shared.hub;
    return this.http.post<any>(ConfigService.defaultConfig.API_SERVER + '/v1/config', config.shared, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((shared: any) => {
        Object.assign(config, ConfigService.defaultConfig);
        Object.assign(config.shared, shared);

        //
        // dates
        config.shared.shippingweek = (shared.shippingweek || []).map(date => new Date(date));

        //
        // HUB extension
        if (config.shared.hub) {
          config.shared.hub.noshipping = config.shared.hub.noshipping || [];
          config.shared.hub.noshipping.forEach(noshipping => {
            noshipping.from = new Date(noshipping.from);
            noshipping.to = new Date(noshipping.to);
          });

          //
          // deposit
          config.shared.hub.deposits = (config.shared.hub.deposits || []).map(deposit => new DepositAddress(
            deposit.name,
            deposit.streetAddress || deposit.streetAdress,
            deposit.floor,
            deposit.region,
            deposit.postalCode,
            deposit.note,
            deposit.geo,
            deposit.weight,
            deposit.active,
            deposit.fees
          ));
        }
        //
        // restore HUB associated before the save
        else {
          config.shared.hub = hub;
        }

        config.shared.faq == config.shared.faq || [];        
        config.shared.faq_title = config.shared.faq_title || {en:"",fr:""};

        return config;
      }),
      tap(config => this.config$.next(config))
    );
  }


  //
  // TODO wait for angular to fix i18n issue (runtime switch)
  // - http://www.ngx-translate.com/ (for dynamic AOT issue?)
  // - https://github.com/angular/angular/issues/11405 (for in ts translation)
  // - https://angular.io/guide/i18n (for static translation AOT compatible!)
  // - https://medium.com/@feloy/deploying-an-i18n-angular-app-with-angular-cli-fc788f17e358 (build locale targets)
  //   +--> https://github.com/ngx-translate/core/issues/495 (plan to integrate runtime lang switch and keep AOT compliant)
  set locale(lang: string) {
    try {
      localStorage.setItem('kng2-locale', lang);
    } catch (e) {}
    this.http.get(config.API_SERVER + '/v1/config?lang=' + lang);
  }

  get locale() {
    // FIXME default locale should not be hardcoded!
    try {
      return localStorage.getItem('kng2-locale') || navigator.language || navigator['userLanguage'] || 'fr';
    } catch (e) {}
    return 'fr';
  }

  /**
   * Subscribe to the user stream.
   */
  // subscribe(
  //   onNext, onThrow?: ((exception: any) => void)|null,
  //   onReturn?: (() => void)|null) {
  //     return this.config$.subscribe({next: onNext, error: onThrow, complete: onReturn});
  // }

}
