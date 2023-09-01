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
import { Utils } from './util';

export class UserAddress {

  constructor(
    name?: string,
    street?: string,
    floor?: string,
    region?: string,
    postalCode?: string,
    note?: string,
    primary?: boolean,
    geo?: any
  ) {
    this.name = name;
    this.streetAdress = street;
    this.floor = floor;
    this.region = region;
    this.postalCode = postalCode;
    this.note = note;
    this.primary = primary;
    this.geo = geo || {lat: 0, lng: 0};
  }
  id?: string;
  name: string;
  note: string;
  floor: string;
  streetAdress: string;
  region: string;
  postalCode: string;
  primary: boolean;
  geo: {
    lat: number;
    lng: number;
  };

  isEqual(address: UserAddress): boolean {
    if(this.id && address.id) {
      return (this.id == address.id);
    }
    return this.streetAdress == address.streetAdress &&
           this.name == address.name &&
           this.floor == address.floor &&
           this.postalCode == address.postalCode;
  }

  static from(content: any) {
    content = content || {};
    const geo = content.geo;
    return new UserAddress(content.name,content.streetAdress,content.floor,content.region,content.postalCode,content.note,false,geo);
  }

}


export class DepositAddress extends UserAddress {
  weight: number;
  active: boolean;
  fees: number;
  constructor(
    name?: string,
    street?: string,
    floor?: string,
    region?: string,
    postalCode?: string,
    note?: string,
    geo?: any,
    weight?: number,
    active?: boolean,
    fees?: number
  ) {
    super(name, street, floor, region, postalCode, note, false, geo);
    this.weight = weight || 0;
    this.fees = fees || 0;
    this.active = active || false;
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

  isEqual(payment: UserCard) {
    return this.number == payment.number &&
           this.alias == payment.alias;
  }
}

export class User {

  deleted: boolean;
  id: number;

  /* The provider which with the user authenticated (facebook, twitter, etc.) */
  provider: string;

  // tslint:disable-next-line: variable-name
  identity:{
    connect_id?: string;
    connect_state?: boolean;    
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

  phoneNumbers: [{
    number: string;
    what: string;
  }];


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
    last1Month: number;
    last3Month: number;
    last6Month: number;
    after6Month: number;
    errors: number;
    count: number;
    latest: Date;
    refunds: number;
    updated: Date;
    rating: number;
    latestErrors: number;
    hubs: any;
    funnel: string;
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
      orders: {
        hubs:{},
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
    this.addresses = this.addresses.map(add => new UserAddress(
      add.name,
      add.streetAdress,
      add.floor,
      add.region,
      add.postalCode,
      add.note,
      add.primary,
      add.geo
    ));
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
    const orders = (json && json.last1Month) ? json : this.orders;
    const shared = {
      new : config.shared.order.new || {},
      recurrent: config.shared.order.recurrent || {}
    };

    const newclient = {
      avg: shared.new.avg || 180,
      last6Month: shared.new.last6Month || 1
    };

    const recurrent = {
      last1Month: shared.recurrent.last1Month || 3,
      last6Month: shared.recurrent.last6Month || 5,
      avg: shared.recurrent.avg || 70
    };

    if (orders.avg > newclient.avg && orders.last6Month >= newclient.last6Month) {
      return true;
    }


    if (orders.last1Month >= recurrent.last1Month || orders.last6Month >= recurrent.last6Month) {
      return (orders.avg > recurrent.avg);
    }

    return false;
  }

  isReady() {
    return (this.email && this.email.status === true);
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
    return new UserAddress();
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

  constructor(
    @Inject('KNG2_OPTIONS') private customConfig: any,
    public http: HttpClient
  ) {
    //
    // Use dynamic server settings
    if (!customConfig.API_SERVER) {
      // customConfig.API_SERVER = ('//api.' + window.location.hostname);
      customConfig.API_SERVER = ('//' + window.location.hostname + '/api');
    }
    // FIXME remove this hugly config propagation
    Object.assign(config, customConfig);
    this.config = config;
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control' : 'no-cache',
      'Pragma' : 'no-cache',
      'ngsw-bypass':'true'
    });
    this.user$ = new ReplaySubject<User>(1);
    this.currentUser = new User();

    try{
      // get marker as helper for the next login
      this.currentUser.email.address = localStorage.getItem('kng-auth');
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
      // TODO unit test of payments/address Class existances after updates
      Object.assign(this.currentUser, new User(user));
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

  // token
  // https://github.com/neroniaky/angular2-token

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
      params: {device: Utils.deviceID(), tls: Date.now() + ''},
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


  customerOblivious(filter?: any): Observable<User[]> {
    filter = filter || {};

    return this.http.get<User[]>(this.config.API_SERVER + '/v1/stats/customers/oblivious', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(users => users.map(user => new User(user)))
    );
  }  

  customerNew(filter?: any): Observable<User[]> {
    filter = filter || {};

    return this.http.get<User[]>(this.config.API_SERVER + '/v1/stats/customers/new', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(users => users.map(user => new User(user)))
    );
  }

  customerEarly(filter?: any): Observable<User[]> {
    filter = filter || {};

    return this.http.get<User[]>(this.config.API_SERVER + '/v1/stats/customers/early', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(users => users.map(user => new User(user)))
    );
  }

  customerRecurrent(filter?: any): Observable<User[]> {
    filter = filter || {};

    return this.http.get<User[]>(this.config.API_SERVER + '/v1/stats/customers/recurrent', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(users => users.map(user => new User(user)))
    );
  }

  customerPremium(filter?: any): Observable<User[]> {
    filter = filter || {};

    return this.http.get<User[]>(this.config.API_SERVER + '/v1/stats/customers/premium', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(users => users.map(user => new User(user)))
    );
  }  

  customerQuit(filter?: any): Observable<User[]> {
    filter = filter || {};

    return this.http.get<User[]>(this.config.API_SERVER + '/v1/stats/customers/quit', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(users => users.map(user => new User(user)))
    );
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
        console.log('user.logout()', user);
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
  // TODO voir lignes commentées (updateGeoCode etc.) + Broadcast
  // app.post('/login', queued(auth.login_post));
  login(data): Observable<User> {
    return this.http.post<User>(this.config.API_SERVER + '/login', data, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map(user => this.updateCache(user)),
      tap(user => {
        try{
          // store a marker as helper for the next login
          localStorage.setItem('kng-auth',user.email.address);
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
