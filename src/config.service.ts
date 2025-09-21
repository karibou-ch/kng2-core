import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Config, config, configCors } from './config';
import { DepositAddress } from './user.service';


// import { _throw } from 'rxjs/observable/throw';
import { Observable, of, throwError } from 'rxjs';
// import { of } from 'rxjs/observable/of';
import { ReplaySubject } from 'rxjs';
import { map, tap, retryWhen, delay, take, distinctUntilChanged, concatMap } from 'rxjs/operators';


@Injectable()
export class ConfigService {

  public static defaultConfig = new Config({
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
    preloadOrders: 5,
    loginPath: ['/admin', '/account'],
    readonlyPath: ['/wallet/create'],
    avoidShopUIIn: ['/admin', '/login', '/signup', '/content']

  });

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
      customConfig.API_SERVER = ('https://' + window.location.hostname + '/api');
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
      params: (params)
    }).pipe(
      retryWhen(errors => errors.pipe(
        delay(1000),
        concatMap((err, index) => index === 3 ? throwError(err) : of(null)))
      ),
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
        //
        // reset hub config
        if(shared.hub){
          config.shared.hub = shared.hub;
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


          const initDeposit = deposit => new DepositAddress(deposit);

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
          config.shared.hub.deposits = (config.shared.hub.deposits || []).map(deposit => new DepositAddress(deposit));
        }
        //
        // restore HUB associated before the save
        else {
          config.shared.hub = hub;
        }

        config.shared.hub.home.customLink = config.shared.hub.home.customLink || {};
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
    const baseLocale = lang.split('-')[0];
    try {
      localStorage.setItem('kng2-locale', baseLocale);
    } catch (e) {}
  }

  get locale() {
    // FIXME default locale should not be hardcoded!
    try {
      const locale = localStorage.getItem('kng2-locale') || navigator.language || navigator['userLanguage'] || 'fr';
      const baseLocale = locale.split('-')[0];
      return baseLocale;
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
