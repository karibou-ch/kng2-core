import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { ReplaySubject ,  Observable ,  SubscriptionLike as ISubscription ,  of ,  from ,  throwError as _throw } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';



// Cannot call a namespace ('moment')
// import * as moment from 'moment';
// https://stackoverflow.com/questions/39519823/using-rollup-for-angular-2s-aot-compiler-and-importing-moment-js
// import  moment from 'moment';
// import 'moment/locale/fr';

//
import { config } from './config';
import { Shop } from './shop.service';
import { XorCipher } from './util';
import { AnalyticsService } from './metrics.service';

//
// FIXME: Refactor UserAddress, DepositAddress, and other AlienAddress for better usability
export class UserAddress {

  constructor(
    content
  ) {
    // for security
    content = content ||{};
    this.type = 'customer';
    this.name = content.name||'';
    this.streetAdress = content.street||content.streetAdress||content.streetAddress||'';
    this.streetAddress = this.streetAdress;
    this.phone = content.phone||'';
    this.floor = content.floor||'';
    this.region = content.region||'';
    this.postalCode = content.postalCode||'';
    this.note = content.note||'';
    this.primary = content.primary;
    this.geo = content.geo || {lat: 0, lng: 0};
  }
  id?: string;
  name: string;
  note: string;
  phone?:string;
  floor: string;
  streetAdress: string;
  streetAddress?: string;
  region: string;
  postalCode: string;
  primary?: boolean;
  type: string|"deposit"|"customer"|"order" = 'customer';
  geo: {
    lat: number;
    lng: number;
    zoom?: number;
  };

  //
  // the heavy international api
  // https://github.com/catamphetamine/libphonenumber-js
  static normalizePhone(phone: string): string {
    if (!phone) return '';

    // Remove all non-digits except leading '+'
    // Regex explanation: (?!^\+) = negative lookahead to preserve leading +
    let normalizedNumber = phone.replace(/(?!^\+)\D/g, '');

    // Convert 00 international prefix to +
    if (normalizedNumber.startsWith('00')) {
      normalizedNumber = '+' + normalizedNumber.slice(2);
    }

    // Swiss mobile numbers: add +41 if starts with 07/08/09
    if (/^0[789]/.test(normalizedNumber)) {
      normalizedNumber = '+41' + normalizedNumber.slice(1);
    }

    return normalizedNumber;
  }

  static isEqual(source:UserAddress|DepositAddress|ShippingAddress, address: UserAddress|DepositAddress|ShippingAddress): boolean {
    if(!source||!address) {
      return false;
    }
    if(source.id && address.id) {
      return (source.id == address.id);
    }
    return source.streetAdress == address.streetAdress &&
           source.name == address.name &&
           source.floor == address.floor &&
           source.postalCode == address.postalCode;
  }

  static from(content: any) :UserAddress|DepositAddress|ShippingAddress {
    content = content || {};
    if(content.when){
      return new ShippingAddress(content);
    }else if(content.weight>=0 && content.fees>=-1) {
      return new DepositAddress(content);
    }else {
      return new UserAddress(content);
    }
  }
}

//
// used for shipping address with Order instance
export class ShippingAddress extends UserAddress {
  constructor(content, when?, hours?){
    content = content ||{};
    super(content)
    this.type = 'order';
    // copy as alias
    this.streetAddress = this.streetAdress;
    this.shipped = content.shipped == true;
    this.deposit = content.deposit == true;
    this.when = new Date(when||content.when);
    this.hours = hours||content.hours;

  }
  when: Date;
  hours: number;
  type:'order'|string;
  parent?: number;
  shopper?: string;
  shopper_time?: string;
  priority?: number;
  position?: number;
  shipped?: boolean|"true"|"false";
  deposit?: boolean|"true"|"false";
  bags?: number;
  estimated?: number;
}

export class DepositAddress extends UserAddress {
  weight: number;
  active: boolean;
  fees: number;
  deposit: boolean;
  constructor(content) {
    content = content ||{};
    super(content);
    this.type = 'deposit';
    this.weight = content.weight || 0;
    this.fees = content.fees || 0;
    this.active = (content.active == true);
    this.deposit = true;
  }
}


export class UserCard {

  constructor(json?: any) {
    Object.assign(this, json || {});
    if (!this.expiry) {
      this.error = 'Unvalid instance';
      this.expiry = new Date(1970, 0, 0).toISOString();
      this.number = this.number||this.last4;
    }
    this.updated = new Date(this.updated);
    this.default = (this.default == true);
  }

  id?: string;
  intent_id?: string;
  alias: string;
  expiry: string;
  issuer: string;
  name: string;
  number: string;
  last4?: string;
  provider: string;
  updated: Date;
  error: string;
  default?: boolean; // karibou-wallet compatibility

  //
  // display expiry
  expiryToDate() {
    const date = new Date(this.expiry);
    const splitted = this.expiry.split('/');
    let month, year;
    if (!isNaN(date.getTime())) {
      return date;
    }

    if (splitted.length > 0) {
      month = parseInt(splitted[0], 10);
      year = parseInt(splitted[1], 10);
      if (year < 1000) {
        year += 2000;
      }
      return new Date(year, month-1);
    }
  }
  //
  // check if card is valid
  isValid() {
    if (this.error) {
      return false;
    }

    const now = new Date();
    const date = this.expiryToDate();
    now.setDate(1);
    now.setHours(0, 0, 0, 1);
    return date > now;
  }

  static isEqual(source: UserCard, payment: UserCard) {
    if(!source||!payment) {
      return false;
    }
    return source.alias == payment.alias;
  }
}

export class User {

  selected: boolean;
  deleted: boolean;
  id: number;

  /* The provider which with the user authenticated (facebook, twitter, etc.) */
  provider: string;

  // tslint:disable-next-line: variable-name
  identity:{
    connect_id?: string;
    connect_state?: boolean;
    authlink?: string;
  };

  email: {
    address: string;
    cc: string;
    status: any;
  };

  /* The name of this user, suitable for display.*/
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };

  tags: string[];
  url: string;

  //
  // phone (DEPRECATED phoneNumbers)
  phoneNumbers: [{
    number: string;
    what: string;
  }];

  phone: string;


  addresses: UserAddress[];

  /* preferred postalCode*/
  logistic: {
    postalCode: string[];
  };


  /* preferred products*/
  likes: number[];

  /* The available Shop for this user */
  shops: Shop[];

  /* disqus sso , payment intent, etc */
  context: any;

  /* payments methods */
  payments: UserCard[];
  balance: number;

  /* default payment method ID (karibou-wallet integration) */
  private _default_payment_method?: string;

  plan:{
    name:string;
    end:Date;
    defaultShipping:number;
    maxInvoices:number
  };

  reminder: {
    defaultHub?: string;
    active: boolean;
    weekdays: number[];
    time: Date;
  };

  orders: {
    avg: number;
    funnel: string;
    profile: string;
    last1Month: number;
    last3Month: number;
    last6Month: number;
    after6Month: number;
    errors: number;
    count: number;
    latest: Date;
    lastMail: Date;
    refunds: number;
    updated: Date;
    rating: number;
    latestErrors: number;
    hubs: any;
  };

  hubs?: string[];

  status: boolean;
  created: Date;
  updated: Date;
  logged: Date;
  roles: string[];
  rank: string;

  constructor(json?: any,email?:string) {
    const defaultUser = {
      id: null,
      name: {},
      tags: [],
      email: {
      },
      reminder: {
        weekdays: []
      },
      likes: [],
      roles: [],
      shops: [],
      phoneNumbers: [{
        number: '',
        what: 'mobile'
      }],
      addresses: [],
      payments: [],
      balance:0,
      logistic: {postalCode: []},
      plan:{
        name:'customer'
      },
      orders: {
        hubs:{},
        profile:'',
        count: 0,
        rating: -1,
        avg: 0,
        latest: 0,
        latestErrors: 0,
        last1Month: 0,
        last3Month: 0,
        last6Month: 0,
      }
    };
    Object.assign(this, defaultUser, json || {});
    if(email && email.indexOf('@')>-1) {
      this.email.address = email;
    }

    //
    // phone (DEPRECATED phoneNumbers)
    if(!this.phone && this.phoneNumbers && this.phoneNumbers.length) {
      this.phone = this.phoneNumbers[0].number;
    }

    if(json && json.balance) {
      this.balance = parseFloat(json.balance||'0');
    }


    //
    // FIXME bad latest date format for some users
    this.orders.latest = new Date(this.orders.latest);
    if(isNaN(this.orders.latest.getTime())){
      this.orders.latest = new Date(0);
    }
    this.orders.updated = new Date(this.orders.updated);
    this.created = new Date(this.created);

    this.payments = this.payments.map(payment => new UserCard(payment));
    this.addresses = this.addresses.map(add => new UserAddress(add));
    this.context = this.context || {};

  }

  //
  // methods
  display() {
    if (this.displayName) {
      return this.displayName;
    }
    if (this.name && (this.name.givenName || this.name.familyName)) {
      return this.name.givenName + ' ' + this.name.familyName;
    }
    if (this.id) {
      return this.id + '@' + this.provider;
    }
    return 'Anonymous';
  }


  loggedTime() {
    return (Date.now() - (new Date(this.logged)).getTime()) / 1000;
  }

  isOwner(shopname) {

    // if (this.isAdmin())return true;
    for (const i in this.shops) {
      if (this.shops[i].name === shopname) {
        return true;
      }
    }
    return false;
  }

  isOwnerOrAdmin(shopname) {
    if (this.isAdmin()) {
      return true;
    }
    return this.isOwner(shopname);
  }

  isAuthenticated(): boolean {
    return this.id > 0 || this.id !== null;
  }

  isAdmin() {
    return this.hasRole('admin');
  }

  isPremium(json?) {
    // if(!this.isAuthenticated()) {
    //   return false;
    // }

    // if(this.hasRole('admin')){
    //   return true;
    // }
    const user = json || this;

    if(!user.plan) {
      return false;
    }

    if([user.plan.name,user.orders.profile].indexOf('premium')>-1) {
      return true;
    }
    if(user.plan.name == 'shareholder') {
      return true;
    }

    return false;
  }

  isReady() {
    // && this.email.status === true
    return (this.email && this.email.address);
  }

  hasRole(role) {
    return (this.roles.indexOf(role) != -1);
  }

  hasLike(product) {
    if (!this.likes || !this.likes.length) {
      return false;
    }
    return (this.likes.indexOf(product.sku) != -1);
  }

  hasPrimaryAddress(): boolean|UserAddress {
    if (this.addresses && this.addresses.length == 1) { return this.addresses[0]; }
    // this.addresses.some(add=>add.primary)
    for (const i in this.addresses) {
      if (this.addresses[i].primary === true) {
        return this.addresses[i];
      }
    }
    return false;
  }


  getEmailStatus(): boolean|Date {
    if (!this.email || !this.email.status) {
      return false;
    }

    if (this.email.status === true) {
      return true;
    }

    return new Date(this.email.status);
    // return moment(this.email.status).format('ddd DD MMM YYYY');

  }

  getDefaultAddress() {
    const add = (this.addresses || []).find(add => add.primary);
    if (add) {
      return add;
    }

    //
    // check with first address
    if (this.addresses && this.addresses.length) {
      return this.addresses[0];
    }

    //
    // return an empty
    return new UserAddress({});
  }

  populateAdresseName() {
    // autofill the address name when available
    if (this.addresses && this.addresses.length && !this.addresses[0].name) {
      this.addresses[0].name = this.name.familyName + ' ' + this.name.givenName;

    }
  }

  getBVR() {
    const self = this;
  }


  //
  // init user
  init() {
    const self = this;

    // set context for error

    if (!self.addresses) {
      return;
    }
    // check address
    self.populateAdresseName();

    // TODO get geo
    // self.geo=new Map();
    self.addresses.forEach(function(address, i) {
      // address is correct
      if (!address.geo || !address.geo.lat || !address.geo.lng) {
        return;
      }
      //
      // TODO setup marker
      // self.geo.addMarker(i,{
      //   lat:address.geo.lat,
      //   lng:address.geo.lng,
      //   message:address.streetAdress+'/'+address.postalCode
      // });
    });

  }

}

export interface CustomerChurn {
  churn:any[];
  users:User[];
}

class Cache {
    list: User[];
    map: Map<number, User>;
    constructor() {
        this.list = [];
        this.map = new Map();
    }
}

@Injectable()
export class UserService {

  mixer:XorCipher;

  //
  // initial code for auth by token or magic authlink
  auth:{
    token: string;
    authlink: string;
    defaultEmail: string;
  }


  constructor(
    @Inject('KNG2_OPTIONS') private customConfig: any,
    public http: HttpClient
  ) {

    //
    // FIXME: remove this mixer, it's not secure enough
    this.mixer = new XorCipher();
    this.auth = {
      token: '',
      authlink: '',
      defaultEmail: ''
    };
    //
    // Use dynamic server settings
    if (!customConfig.API_SERVER) {
      // customConfig.API_SERVER = ('//api.' + window.location.hostname);
      customConfig.API_SERVER = ('https://' + window.location.hostname + '/api');
    }
    // FIXME remove this hugly config propagation
    Object.assign(config, customConfig);
    this.config = config;
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control' : 'no-cache',
      'Pragma' : 'no-cache',
      'ngsw-bypass':'true',
      'k-dbg': AnalyticsService.FBP
    });
    this.user$ = new ReplaySubject<User>(1);
    this.currentUser = new User();

    try{
      const isMail=(val) => {
        if (!val) return false;
        const $email = /^[^@]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return $email.test(val) && val;
      };
      // get marker as helper for the next login
      const value = localStorage.getItem('kng-auth');
      if(isMail(value)) {
        this.auth.defaultEmail = value;
        this.currentUser.email.address = value;
      }
      //const address = this.mixer.decode(config.shared.key,value);
      //this.currentUser.email.address = isMail(address)||value;
    }catch(err) {}

  }




  // TODO make observable content !!
  config: any;
  currentUser: User;
  private cache = new Cache();


  private headers: HttpHeaders;
  public  user$: ReplaySubject<User>;

  private updateCache(user: User) {
    if (!this.cache.map.get(user.id)) {
      if(!this.currentUser.id||this.currentUser.id == user.id) {
        Object.assign(this.currentUser, new User(user));
      }
      this.cache.map.set(user.id, this.currentUser);
      return this.cache.map.get(user.id);
    }
    // Object.assign(this.currentUser, new User(user));
    return Object.assign(this.cache.map.get(user.id), new User(user));
  }

  private deleteCache(user: User) {
      const incache = this.cache.map.get(user.id);
      if (incache) {
          incache.deleted = true;
          this.cache.map.delete(user.id);
      }
      return incache;
  }

  //
  // token & magic link
  // FIXME: make this a real service with specs (current version is for testing purpose)
  digestMagicAuth(){
    try{
      const token = /token=([^&]*)/gm.exec(window.location.href);
      if(token && token.length>1){
        this.auth.token = token[1];
      }
      const authlink = /authlink=([^&]*)/gm.exec(window.location.href);
      if(authlink && authlink.length>1){
        this.auth.authlink = authlink[1];
      }

    }catch(e){}
  }

  getMagicAuthToken(){
    //
    // check existance on token
    if (!this.auth.token && !this.auth.authlink) {
      return {
        email: this.auth.defaultEmail,
        password: '',
        magic: false
      };
    }
    if(this.auth.authlink){
      return {
        email: this.auth.defaultEmail,
        password: this.auth.authlink,
        magic: true
      };
    }

    // decode token
    let defaultPassword = '';
    try{
      const fields = atob(this.auth.token).split('::');
      if (fields.length === 2) {
        this.auth.defaultEmail = fields[0];
        defaultPassword = fields[1];
      }
    }catch(e) {}

    return {
      email: this.auth.defaultEmail,
      password: defaultPassword,
      magic: false
    };
  }


  //
  // How to build Angular apps using Observable Data Services
  // http://blog.angular-university.io/how-to-build-angular2-apps-using-rxjs-observable-data-services-pitfalls-to-avoid/

  // get user data by his id
  get(id: number, forceload?:boolean): Observable<User> {

    if (!forceload && this.cache.map[id]) {
      return of(this.cache.map[id]);
    }

    return this.http.get<User>(this.config.API_SERVER + '/v1/users/' + id, {
      params: { tls: Date.now() + ''},
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((user) => new User(user)),
      catchError(err => of(new User()))
    );

  }

  //
  // ============================= REST api wrapper

  // Stripe connect
  // app.get('/v1/users/connect?code&state', auth.ensureAuthenticated, users.connect);
  connect(id, state, code) {
    if (!this.config.API_SERVER) {
      throw new Error('Issue with uninitialized server context');
    }
    const params: any = {
      state,
      code
    };

    return this.http.get<User>(this.config.API_SERVER + '/v1/users/' + id + '/connect', {
      params: (params),
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.updateCache(user)),
      tap(user => this.user$.next(user))
    );
  }

  // app.get('/v1/users/me', auth.ensureAuthenticated, users.me);
  me(): Observable<User> {
    if (!this.config.API_SERVER) {
      throw new Error('Issue with uninitialized server context');
    }

    return this.http.get<User>(this.config.API_SERVER + '/v1/users/me', {
      params: {tls: Date.now() + ''},
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => {
        this.updateCache(user);
        return this.currentUser;
      }),
      catchError(err => of(new User({},this.currentUser.email.address))),
      tap(user => this.user$.next(user))
    );
  }

  createOrUpdateAuthLink(id:number,options:any): Observable<any> {
    return this.http.post<any>(this.config.API_SERVER + '/v1/users/' + id + '/autolink', options, {
      headers: this.headers,
      withCredentials: true
    });
  }
  applyCode(code:string): Observable<User> {
    return this.http.get<User>(this.config.API_SERVER + '/v1/users/redeem/'+code, {
      params: {tls: Date.now() + ''},
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => {
        this.updateCache(user);
        return this.currentUser;
      }),
      tap(user => this.user$.next(user))
    );
  }


  query(filter?: any): Observable<User[]> {
    filter = filter || {};

    return this.http.get<User[]>(this.config.API_SERVER + '/v1/users/', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(users => users.map(user => new User(user)))
    );
  }

  crmFunnel(content): Observable<any> {
    // var self = this, params = {};
    return this.http.post<any>(this.config.API_SERVER + '/v1/crm/funnel', content, {
      headers: this.headers,
      withCredentials: true
    });
  }

  crmEmail(content): Observable<any> {
    // var self = this, params = {};
    return this.http.post<any>(this.config.API_SERVER + '/v1/crm/emails', content, {
      headers: this.headers,
      withCredentials: true
    });
  }


  customerOblivious(filter?: any): Observable<CustomerChurn> {
    filter = filter || {};

    return this.http.get<CustomerChurn>(this.config.API_SERVER + '/v1/stats/customers/oblivious', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(churn => {
        return {
          churn:churn.churn||[],
          users:churn.users.map(user => new User(user))
        }
      })
    );
  }

  customerNew(filter?: any): Observable<CustomerChurn> {
    filter = filter || {};

    return this.http.get<CustomerChurn>(this.config.API_SERVER + '/v1/stats/customers/new', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(churn => {
        return {
          churn:churn.churn||[],
          users:churn.users.map(user => new User(user))
        }
      })
    );
  }

  customerOccasional(filter?: any): Observable<CustomerChurn> {
    filter = filter || {};

    return this.http.get<CustomerChurn>(this.config.API_SERVER + '/v1/stats/customers/early', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(churn => {
        return {
          churn:churn.churn||[],
          users:churn.users.map(user => new User(user))
        }
      })
    );
  }

  customerRecurrent(filter?: any): Observable<CustomerChurn> {
    filter = filter || {};

    return this.http.get<CustomerChurn>(this.config.API_SERVER + '/v1/stats/customers/recurrent', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(churn => {
        return {
          churn:churn.churn||[],
          users:churn.users.map(user => new User(user))
        }
      })
    );
  }

  customerPremium(filter?: any): Observable<CustomerChurn> {
    filter = filter || {};

    return this.http.get<CustomerChurn>(this.config.API_SERVER + '/v1/stats/customers/premium', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(churn => {
        return {
          churn:churn.churn||[],
          users:churn.users.map(user => new User(user))
        }
      })
    );
  }

  customerQuit(filter?: any): Observable<CustomerChurn> {
    filter = filter || {};

    return this.http.get<CustomerChurn>(this.config.API_SERVER + '/v1/stats/customers/quit', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(churn => {
        return {
          churn:churn.churn||[],
          users:churn.users.map(user => new User(user))
        }
      })
    );
  }

  customerChurn(filter?: any): Observable<any> {
    filter = filter || {};

    return this.http.get<any[]>(this.config.API_SERVER + '/v1/stats/customers/churn', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    });
  }

  // Reçoit un statut de requête http
  // app.get ('/v1/validate/:uid/:email', emails.validate);
  validate(id, email): Observable<any> {
    if (!id || !email) {
      return _throw(new Error('validate, missing parameter id or email'));
    }


    return this.http.get(this.config.API_SERVER + '/v1/validate/' + id + '/' + email, {
      headers: this.headers,
      withCredentials: true
    });

  }

  // app.post('/v1/validate/create',auth.ensureAuthenticated, emails.create);
  validateEmail(params?: any): Observable<any> {
    return this.http.post<{created: Date, email: string}>(this.config.API_SERVER + '/v1/validate/create', params || {}, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(result => {
        this.currentUser.email.status = result.created;
        return this.currentUser;
      }),
      tap(user => this.user$.next(user))
    );
  }

  // app.post('/v1/recover/:token/:email/password', users.recover);
  recover(email): Observable<any> {
    return this.http.post(this.config.API_SERVER + '/v1/recover/' + this.config.shared.token + '/' + email + '/password', {
      headers: this.headers,
      withCredentials: true
    });
  }



  // app.post('/v1/users/:id', users.ensureMeOrAdmin,users.update);
  save(user): Observable<User> {
    // autofill the address name when available
    user.populateAdresseName();
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + user.id, user, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.updateCache(user)),
      tap(user => this.user$.next(user))
    );
  }

  // app.get ('/logout', auth.logout);
  logout(): Observable<User> {
    return this.http.get<User>(this.config.API_SERVER + '/logout/', {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      catchError(err => of(new User())),
      map(user => Object.assign(this.currentUser, new User({},this.currentUser.email.address))),
      tap(user => {
        // console.log('user.logout()', user);
        return this.user$.next(user);
      })
    );
  }

  // TODO voir lignes commentées (updateGeoCode etc.)
  // app.post('/register', queued(auth.register_post));
  register(user): Observable<User> {
    // user.populateAdresseName();
    return this.http.post<User>(this.config.API_SERVER + '/register', user, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.updateCache(user)),
      tap(user => this.user$.next(user))
    );

  }
  // app.post('/v1/users/:id/password',users.ensureMe, users.password);
  newpassword(id: number, change): Observable<User> {
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + id + '/password', change, {
      headers: this.headers,
      withCredentials: true
    });
  }


  //
  // FIXME: make this a real service with specs (current version is not secure)
  login(data): Observable<User> {
    return this.http.post<User>(this.config.API_SERVER + '/login', data, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.updateCache(user)),
      tap(user => {
        try{
          // store a marker as helper for the next login
          if(!user.isAdmin || !user.isAdmin()) {
            localStorage.setItem('kng-auth',user.email.address);
          }
        }catch(err) {}
        this.user$.next(user)
      })
    );
  }

  // app.put('/v1/users/:id', auth.ensureAdmin, auth.checkPassword, users.remove);
  remove(id, password): Observable<any> {
    return this.http.put<User>(this.config.API_SERVER + '/v1/users/' + id, { password }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.deleteCache(user))
    );
  }

  // app.post('/v1/users/:id/like/:sku', users.ensureMe, users.like);
  love(id, product): Observable<User> {
    // var self=this, params={};
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + id + '/like/' + product.sku, null, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.updateCache(user)),
      tap(user => this.user$.next(user))
    );
  }
  // ================================================


  addressAdd(uid,address: UserAddress) {
    if (!address||!address.name) {
      return _throw(new Error('addressUpdate missing address content'));
    }
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + uid + '/address/add', address, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.updateCache(user)),
      tap(user => this.user$.next(user))
    );

  }

  addressRemove(uid, address: UserAddress) {
    if (!address||!address.id) {
      return _throw(new Error('addressUpdate missing address id'));
    }
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + uid + '/address/remove', address, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.updateCache(user)),
      tap(user => this.user$.next(user))
    );
  }

  addressUpdate(uid, address: UserAddress) {
    if (!address||!address.id) {
      return _throw(new Error('addressUpdate missing address id'));
    }
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + uid + '/address/update', address, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.updateCache(user)),
      tap(user => this.user$.next(user))
    );
  }

  /**
   * payment methods
   */
  // app.post('/v1/users/:id/payment/:alias/check', users.ensureMeOrAdmin,users.checkPaymentMethod);
  checkPaymentMethod(user, askIntent?: string, amount?:number): Observable<User> {
    //
    // if payment list is empty, and also ask intent
    if (!user.payments.length && !askIntent) {
      return of(user);
    }

    const params: any = { };
    if (askIntent) {
      params.intent = askIntent;
    }
    if(amount) {
      params.amount = amount;
    }

    return this.http.post<any>(this.config.API_SERVER + '/v1/users/' + user.id + '/payment/-/check', {}, {
      params,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(check => {
        //
        // store payment intent
        if (check.intent) {
          user.context = user.context || {};
          user.context.intent = check.intent;
        }
        user.payments.forEach((payment, i) => {
          payment.error = check[payment.alias] && check[payment.alias].error;
        });
        return this.updateCache(user);
      })
    );
  }

  // app.post('/v1/users/:id/payment', users.ensureMeOrAdmin,users.addPayment);
  addPaymentMethod(payment: UserCard, uid, replace?: boolean): Observable<User> {
    if (!payment.id) {
      return _throw(new Error('addPaymentMethod missing payment id'));
    }
    const params: any = {};
    if (replace) {
      params.force_replace = true;
    }

    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + uid + '/payment', payment, {
      params,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.updateCache(user)),
      tap(user => this.user$.next(user))
    );
  }

  // app.post('/v1/users/:id/payment', users.ensureMeOrAdmin,users.addPayment);
  addPaymentCreditMethod(uid, month:string, year: string): Observable<User> {
    const params: any = {};
    const credit ={
      month,year
    }

    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + uid + '/payment/credit', credit, {
      params,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.updateCache(user)),
      tap(user => this.user$.next(user))
    );
  }


  // app.post('/v1/users/:id/payment/:alias/delete', users.ensureMeOrAdmin,users.deletePayment);
  deletePaymentMethod(alias, uid): Observable<User> {
    const updatePayment = (uid) => {
      const user = this.cache.map.get(uid);
      user.payments = user.payments.filter(p => p.alias != alias);
      return user;
    };
    if (!alias || !uid) {
      return _throw(new Error('deletePaymentMethod, missing params!'));
    }
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + uid + '/payment/' + alias + '/delete', null, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(() => updatePayment(uid)),
      tap(user => this.user$.next(user))
    );
  }

  /**
   * ADMIN
   */
  // app.post('/v1/users/:id/status', auth.ensureAdmin,users.status);
  updateStatus(id, status): Observable<User> {
    // var self = this, params = {};
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + id + '/status', { status }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => new User(user)),
      tap(user => this.user$.next(user))
    );
  }

  /**
   * Subscribe to the user stream.
   */
  subscribe(
    onNext, onThrow?: ((exception: any) => void)|null,
    onReturn?: (() => void)|null): ISubscription {
      return this.user$.subscribe({next: onNext, error: onThrow, complete: onReturn});
  }

}
