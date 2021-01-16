import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Config, config } from './config';
import { DepositAddress } from './user.service';
import { ConfigService } from './config.service';


// import { _throw } from 'rxjs/observable/throw';
import { Observable } from 'rxjs';
// import { of } from 'rxjs/observable/of';
import { ReplaySubject } from 'rxjs';
import { map, tap, retryWhen, delay, take } from 'rxjs/operators';

export class Hub {
  name: string;
  description: { en: string, fr: string, de: string};

  //
  // instance of HUB based on a list of slug alias
  slug: string;
  updated: Date;
  logo: string;

  address: {
    streetAdress: string;
    postalCode: string;
    region: string;
    phone: string;
    url: string;
    geo: {
      lat: number;
      lng: number;
    }
  };

  // FIXME use i18n for mail content
  mail: {
    address: string;
    signature: string;
    subject: string;
  };

  colors: {
    primary: string,
    primaryText: string,
    action: string,
    actionText: string,
  };

  //
  // HUB dedicated settings

  /* HUB can be inactive, under construction */
  status: {
    reason:{ en: string, fr: string, de: string},
    active: boolean;
  };

  /* display message web maintenance (that mean that all shipping are off) */
  maintenance: {
    reason: { en: string, fr: string, de: string },
    active: boolean;
  };

  header: {
    message: { en: string, fr: string, de: string },
    active: boolean;
  };

  //
  // display checkout message
  checkout: {
    title: { en: string, fr: string, de: string },
    address: { en: string, fr: string, de: string },
    payment: { en: string, fr: string, de: string },
    resume: { en: string, fr: string, de: string },
    message: { en: string, fr: string, de: string },
    active: boolean;
  };

  //
  // list of deposit address
  deposits: DepositAddress[];

  //
  // list of closed dates
  noshipping: [{
    reason: { en: string, fr: string, de: string };
    from: Date;
    to: Date;
  }];

  siteName: {
    en: string;
    de: string;
    fr: string;
    image: string;
  };

  about: {
    h: { en: string, de: string, fr: string };
    t: { en: string, de: string, fr: string };
    p: { en: string, de: string, fr: string };
    image: string;
  };

  tagLine: {
    t: { en: string, de: string, fr: string };
    h: { en: string, de: string, fr: string };
    p: { en: string, de: string, fr: string };
    image: string;
  };

  footer: {
    t: { en: string, de: string, fr: string };
    h: { en: string, de: string, fr: string };
    p: { en: string, de: string, fr: string };
    image: string;
  };

  //
  // DEPRECATED remove home field
  home:{
    // DEPRECATED
    // // display campagn page in home?
    // email:String,
    // phone:String,
    // // FIXME use i18n for mail content
    // mail:{
    //   signature:String,
    //   subject:String
    // },
    content:[{
      h: { en: string, de: string, fr: string };
      t: { en: string, de: string, fr: string };
      p: { en: string, de: string, fr: string };
      image: string;
      target: string;
    }],
    shop:{
      t: { en: string, de: string, fr: string };
      h: { en: string, de: string, fr: string };
      p: { en: string, de: string, fr: string };
      image: string;
    },
    selection: {
      h: { en: string, de: string, fr: string };
      t: { en: string, de: string, fr: string };
      p: { en: string, de: string, fr: string };
      image: string;
    },
    howto: {
      h: { en: string, de: string, fr: string };
      t: { en: string, de: string, fr: string };
      p: { en: string, de: string, fr: string };
      image: string;
    }
  };

  //
  // Owner of the HUB
  manager?: string[];
  logistic?: string[];

  //
  // HUB dedicated configuration
  /* limit HUB orders */
  currentLimit: number;

  /* additional limit for premium users. max orders = (currentLimit + premiumLimit) */
  premiumLimit: number;

  /* HUB fees added to the product price  */
  serviceFees: number;

  /* order is in timeout if payment status != 'paid' and created<15m (timeoutAndNotPaid)*/
  timeoutAndNotPaid: number;

  /* for testing 50 hours is the time limit between order and delivery*/
  /* timelimit = monday 18:00 + timelimit = dayDest 9:00*/
  timelimit: number;

  //
  // stripe uncaptured charges expire in 7 days
  // https://support.stripe.com/questions/does-stripe-support-authorize-and-capture 
  uncapturedTimeLimit: number;

  /* order date range between day1 to day2 max 11:00. Lapse time = timelimit */
  timelimitH: number;


  //
  // Dimanche(0), Lundi, Mardi, Mercredi, Jeudi, Vendredi, Samedi
  weekdays: number[];

  // FIXME use i18n for times labels
  shippingtimes: {
    type: any;
    default: any;
  };


  //
  // constraint HuB to a list of categories and vendors
  categories: string[];
  vendors: string[];

}

@Injectable()
export class HubService {

  private headers: HttpHeaders;
  public config: Config | any;
  public hub$: ReplaySubject<Hub>;

  constructor(
    private http: HttpClient
  ) {
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.hub$ = new ReplaySubject<Hub>(1);
    this.config = ConfigService.defaultConfig;

  }


  get(hub: string): Observable<Hub> {
    const params = { hub };
    return this.http.get<Hub>(this.config.API_SERVER + '/v1/hubs/' + hub, {
      headers: this.headers,
      withCredentials: true,
      params: (params)
    }).pipe(
      tap(hub => this.hub$.next(hub))
    );
  }

  save(hub: Hub) {
    return this.http.post<Hub>(this.config.API_SERVER + '/v1/hubs/' + hub.slug, hub, {
      headers: this.headers,
      withCredentials: true
  }).pipe(
      // retryWhen(errors => errors.pipe(delay(1000), take(3))),
      tap(hub => this.hub$.next.bind(hub))
  );
  }

  saveManager(hub: Hub) {
    return this.http.post<Hub>(this.config.API_SERVER + '/v1/hubs/' + hub.slug + '/manage', hub, {
      headers: this.headers,
      withCredentials: true
  }).pipe(
      // retryWhen(errors => errors.pipe(delay(1000), take(3))),
      tap(hub => this.hub$.next.bind(hub))
  );
  }

}
