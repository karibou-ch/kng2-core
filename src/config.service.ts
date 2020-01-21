import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Config, config, ConfigKeyStoreEnum } from './config';
import { UserAddress, DepositAddress } from './user.service';

// import { _throw } from 'rxjs/observable/throw';
import { Observable } from 'rxjs/Observable';
// import { of } from 'rxjs/observable/of';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { map, tap } from 'rxjs/operators';
import { ISubscription } from 'rxjs/Subscription';

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
      token: 'Zz7YkTpPPp5YFQnCprtc7O9'
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
      customConfig.API_SERVER = ('//api.' + window.location.hostname);
    }

    Object.assign(ConfigService.defaultConfig, customConfig || {});
    // FIXME, remove this hugly config propagation
    Object.assign(config, customConfig || {});

    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.config$ = new ReplaySubject<Config>(1);
  }

  public get(): Observable<Config> {
    const lang = this.locale;
    this.config = this.http.get<any>(ConfigService.defaultConfig.API_SERVER + '/v1/config?lang=' + lang, {
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map((shared: any) => {
        Object.assign(config, ConfigService.defaultConfig);
        Object.assign(config.shared, shared);

        //
        // fill dates
        config.shared.shippingweek = (shared.shippingweek || []).map((date) => new Date(date));
        config.shared.noshipping.forEach((noshipping) => {
          noshipping.from = new Date(noshipping.from);
          noshipping.to = new Date(noshipping.to);
        });

        //
        // deposit
        config.shared.deposits = (config.shared.deposits || []).map((deposit) => new DepositAddress(
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
        return config;
      })
    );
    return this.config;
  }

  public setServer(url: string) {
    if (!url) {
      throw new Error('set server url is Null');
    }
    ConfigService.defaultConfig.API_SERVER = url;
    //
    // TODO save url to the localStorage AND use it on load
  }

  public save(config: Config, cid?: string): Observable<any> {
    return this.http.post<any>(ConfigService.defaultConfig.API_SERVER + '/v1/config', config.shared, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((shared: any) => {
        Object.assign(config, ConfigService.defaultConfig);
        Object.assign(config.shared, shared);

        //
        // dates
        config.shared.shippingweek = (shared.shippingweek || []).map((date) => new Date(date));
        config.shared.noshipping.forEach((noshipping) => {
          noshipping.from = new Date(noshipping.from);
          noshipping.to = new Date(noshipping.to);
        });

        //
        // deposit
        config.shared.deposits = (config.shared.deposits || []).map((deposit) => new DepositAddress(
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

        return config;
      }),
      tap((config) => this.config$.next(config))
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
    } catch (e) {} // TODO TSLINT

    this.http.get(config.API_SERVER + '/v1/config?lang=' + lang);
  }

  get locale() {
    // FIXME default locale should not be hardcoded!
    try {
      return localStorage.getItem('kng2-locale') || navigator.language || navigator['userLanguage'] || 'fr';
    } catch (e) {} // TODO TSLINT
    return 'fr';
  }

  /**
   * Subscribe to the user stream.
   */
  public subscribe(
    onNext, onThrow?: ((exception: any) => void)|null,
    onReturn?: (() => void)|null): ISubscription {
      return this.config$.subscribe({next: onNext, error: onThrow, complete: onReturn});
  }

}
