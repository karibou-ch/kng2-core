import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { ISubscription } from 'rxjs/Subscription';

import { of } from 'rxjs/observable/of';
import { from } from 'rxjs/observable/from';
import { _throw } from 'rxjs/observable/throw';
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
  public name: string;
  public note: string;
  public floor: string;
  public streetAdress: string;
  public region: string;
  public postalCode: string;
  public primary: boolean;
  public geo: {
    lat: number;
    lng: number;
  };

  public isEqual(address: UserAddress): boolean {
    return this.streetAdress === address.streetAdress &&
           this.name === address.name &&
           this.floor === address.floor &&
           this.postalCode === address.postalCode;
  }

}

export class DepositAddress extends UserAddress {
  public weight: number;
  public active: boolean;
  public fees: number;
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
    }
    this.updated = new Date(this.updated);
  }

  public id?: string;
  public alias: string;
  public expiry: string;
  public issuer: string;
  public name: string;
  public number: string;
  public provider: string;
  public updated: Date;
  public error: string;

  //
  // display expiry
  public expiryToDate() {
    const date = new Date(this.expiry);
    const splitted = this.expiry.split('/');
    let month;
    let year;
    if (!isNaN(date.getTime())) {
      return date;
    }

    if (splitted.length > 0) {
      month = parseInt(splitted[0], 10);
      year = parseInt(splitted[1], 10);
      if (year < 1000) {
        year += 2000;
      }
      return new Date(year, month);
    }
  }
  //
  // check if card is valid
  public isValid() {
    if (this.error) {
      return false;
    }

    const now = new Date();
    const date = this.expiryToDate();
    now.setDate(1);
    now.setHours(0, 0, 0, 1);
    return date > now;
  }

  public isEqual(payment: UserCard) {
    return this.number === payment.number &&
           this.alias === payment.alias;
  }
}

export class User {

  public deleted: boolean;
  public id: number;

  /* The provider which with the user authenticated (facebook, twitter, etc.) */
  public provider: string;

  public email: {
    address: string;
    cc: string;
    status: any;
  };

  /* The name of this user, suitable for display.*/
  public displayName: string;
  public name: {
    familyName: string;
    givenName: string;
  };

  public birthday: Date;
  public gender: string;
  public tags: string[];
  public url: string;

  public phoneNumbers: [{
    number: string;
    what: string;
  }];

  public photo: string;

  public addresses: UserAddress[];

  /* preferred postalCode*/
  public logistic: {
    postalCode: string[];
  };

  /* preferred products*/
  public likes: number[];

  /* The available Shop for this user */
  public shops: Shop[];

  /* disqus sso */
  public context: any;

  /* payments methods */
  public payments: UserCard[];
  // payments:[{
  //   type:{type:String},
  //   name:{type:String},
  //   number:{type:String},
  //   expiry:{type:String},
  //   provider:{type:String,unique:true,required:true},
  //   alias:{type:String,unique:true,required:true}
  // }],

  public merchant: boolean;

  public reminder: {
    active: boolean;
    weekdays: number[];
    time: Date;
  };

  public status: boolean;
  public created: Date;
  public updated: Date;
  public logged: Date;
  public roles: string[];
  public rank: string;

  constructor(json?: any) {
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
      logistic: {postalCode: []}
    };
    Object.assign(this, defaultUser, json || {});
    this.payments = this.payments.map((payment) => new UserCard(payment));
    this.addresses = this.addresses.map((add) => new UserAddress(
      add.name,
      add.streetAdress,
      add.floor,
      add.region,
      add.postalCode,
      add.note,
      add.primary,
      add.geo
    ));
  }

  //
  // methods
  public display() {
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

  public loggedTime() {
    return (Date.now() - (new Date(this.logged)).getTime()) / 1000;
  }

  public isOwner(shopname) {

    // if (this.isAdmin())return true;
    for (const i in this.shops) {
      if (this.shops[i].name === shopname) {
        return true;
      }
    }
    return false;
  }

  public isOwnerOrAdmin(shopname) {
    if (this.isAdmin()) {
      return true;
    }
    return this.isOwner(shopname);
  }

  public isAuthenticated(): boolean {
    return this.id > 0 || this.id !== null;
  }

  public isAdmin() {
    return this.hasRole('admin');
  }

  public isReady() {
    return (this.email && this.email.status === true);
  }

  public hasRole(role) {
    return (this.roles.indexOf(role) !== -1);
  }

  public hasLike(product) {
    if (!this.likes || !this.likes.length) {
      return false;
    }
    return (this.likes.indexOf(product.sku) !== -1);
  }

  public hasPrimaryAddress(): boolean|UserAddress {
    if (this.addresses && this.addresses.length === 1) { return this.addresses[0]; }
    // this.addresses.some(add=>add.primary)
    for (const i in this.addresses) {
      if (this.addresses[i].primary === true) {
        return this.addresses[i];
      }
    }
    return false;
  }

  public getEmailStatus(): boolean|Date {
    if (!this.email || !this.email.status) {
      return false;
    }

    if (this.email.status === true) {
      return true;
    }

    return new Date(this.email.status);
    // return moment(this.email.status).format('ddd DD MMM YYYY');

  }

  public getDefaultAddress() {
    const add = (this.addresses || []).find((add) => add.primary);
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

  public populateAdresseName() {
    // autofill the address name when available
    if (this.addresses && this.addresses.length && !this.addresses[0].name) {
      this.addresses[0].name = this.name.familyName + ' ' + this.name.givenName;

    }
  }

  public getBVR() {
    const self = this;
  }

  //
  // init user
  public init() {
    const self = this;

    // set context for error

    if (!self.addresses) {
      return;
    }
    // check address
    self.populateAdresseName();

    // TODO get geo
    // self.geo=new Map();
    // TOCHECK TSLINT
    self.addresses.forEach((address, i) => {
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
    public list: User[];
    public map: Map<number, User>;
    constructor() {
        this.list = [];
        this.map = new Map();
    }
}

@Injectable()
export class UserService {

  // TODO make observable content !!
  public config: any;
  public currentUser: User = new User();
  private cache = new Cache();

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

  private headers: HttpHeaders;
  public  user$: ReplaySubject<User>;

  constructor(
    @Inject('KNG2_OPTIONS') private customConfig: any,
    public http: HttpClient
  ) {
    //
    // Use dynamic server settings
    if (!customConfig.API_SERVER) {
      customConfig.API_SERVER = ('//api.' + window.location.hostname);
    }
    // FIXME remove this hugly config propagation
    Object.assign(config, customConfig);
    this.config = config;
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.user$ = new ReplaySubject<User>(1);
  }

  // token
  // https://github.com/neroniaky/angular2-token

  //
  // How to build Angular apps using Observable Data Services
  // http://blog.angular-university.io/how-to-build-angular2-apps-using-rxjs-observable-data-services-pitfalls-to-avoid/

  // get user data by his id
  public get(id: number): Observable<User> {

    if (this.cache.map[id]) {
      return of(this.cache.map[id]);
    }

    return this.http.get<User>(this.config.API_SERVER + '/v1/users/' + id, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((user) => new User(user)),
      catchError((err) => of(new User()))
    );

  }

  //
  // ============================= REST api wrapper
  // TODO

  // app.get('/v1/users/me', auth.ensureAuthenticated, users.me);
  public me(): Observable<User> {
    if (!this.config.API_SERVER) {
      throw new Error('Issue with uninitialized server context');
    }
    return this.http.get<User>(this.config.API_SERVER + '/v1/users/me', {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((user) => {
        this.updateCache(user);
        return this.currentUser;
      }),
      catchError((err) => of(new User()))
    );
  }

  // app.get('/v1/users', auth.ensureAdmin, users.list);
  public query(filter?: any): Observable<User[]> {
    filter = filter || {};

    return this.http.get<User[]>(this.config.API_SERVER + '/v1/users/', {
      params: filter,
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((users) => users.map((user) => new User(user)))
    );
  }

  // Reçoit un statut de requête http
  // app.get ('/v1/validate/:uid/:email', emails.validate);
  public validate(id, email): Observable<any> {
    if (!id || !email) {
      return _throw(new Error('validate, missing parameter id or email'));
    }

    return this.http.get(this.config.API_SERVER + '/v1/validate/' + id + '/' + email, {
      headers: this.headers,
      withCredentials: true
    });

  }

  // app.post('/v1/validate/create',auth.ensureAuthenticated, emails.create);
  public validateEmail(params?: any): Observable<any> {
    return this.http.post<{created: Date, email: string}>(this.config.API_SERVER + '/v1/validate/create', params || {}, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((result) => {
        this.currentUser.email.status = result.created;
        return this.currentUser;
      }),
      tap((user) => this.user$.next(user))
    );
  }

  // app.post('/v1/recover/:token/:email/password', users.recover);
  public recover(email): Observable<any> {
    return this.http.post(this.config.API_SERVER + '/v1/recover/' + this.config.shared.token + '/' + email + '/password', {
      headers: this.headers,
      withCredentials: true
    });
  }

  // app.post('/v1/users/:id', users.ensureMeOrAdmin,users.update);
  public save(user): Observable<User> {
    // autofill the address name when available
    user.populateAdresseName();
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + user.id, user, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((user) => this.updateCache(user)),
      tap((user) => this.user$.next(user))
    );
  }

  // app.get ('/logout', auth.logout);
  public logout(): Observable<User> {
    return this.http.get<User>(this.config.API_SERVER + '/logout/', {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      catchError((err) => of(new User())),
      map((user) => Object.assign(this.currentUser, new User())),
      tap((user) => {
        console.log('user.logout()', user);
        return this.user$.next(user);
      })
    );
  }

  // TODO voir lignes commentées (updateGeoCode etc.)
  // app.post('/register', queued(auth.register_post));
  public register(user): Observable<User> {
    // user.populateAdresseName();
    return this.http.post<User>(this.config.API_SERVER + '/register', user, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((user) => this.updateCache(user)),
      tap((user) => this.user$.next(user))
    );

  }

  // app.post('/v1/users/:id/password',users.ensureMe, users.password);
  public newpassword(id: number, change): Observable<User> {
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + id + '/password', change, {
      headers: this.headers,
      withCredentials: true
    });
  }

  // TODO voir lignes commentées (updateGeoCode etc.) + Broadcast
  // app.post('/login', queued(auth.login_post));
  public login(data): Observable<User> {
    return this.http.post<User>(this.config.API_SERVER + '/login', data, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((user) => this.updateCache(user)),
      tap((user) => this.user$.next(user))
    );
  }

  // app.put('/v1/users/:id', auth.ensureAdmin, auth.checkPassword, users.remove);
  public remove(id, password): Observable<any> {
    return this.http.put<User>(this.config.API_SERVER + '/v1/users/', { password }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((user) => this.deleteCache(user))
    );
  }

  // app.post('/v1/users/:id/like/:sku', users.ensureMe, users.like);
  public love(id, product): Observable<User> {
    // var self=this, params={};
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + id + '/like/' + product.sku, null, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((user) => this.updateCache(user)),
      tap((user) => this.user$.next(user))
    );
  }
  // ================================================

  /**
   * payment methods
   */
  // app.post('/v1/users/:id/payment/:alias/check', users.ensureMeOrAdmin,users.checkPaymentMethod);
  public checkPaymentMethod(user): Observable<User> {
    if (!user.payments.length) {
      return of(user);
    }

    const allAlias = user.payments.map((payment) => payment.alias);
    const alias = allAlias.pop();

    return this.http.post<any>(this.config.API_SERVER + '/v1/users/' + user.id + '/payment/' + alias + '/check', {alias: allAlias}, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((check) => {
        user.payments.forEach((payment, i) => {
          payment.error = check[payment.alias] && check[payment.alias].error;
        });
        return this.updateCache(user);
      })
    );
  }

  // app.post('/v1/users/:id/payment', users.ensureMeOrAdmin,users.addPayment);
  public addPaymentMethod(payment: UserCard, uid): Observable<User> {
    if (!payment.id) {
      return _throw(new Error('addPaymentMethod missing payment id'));
    }

    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + uid + '/payment', payment, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((user) => this.updateCache(user)),
      tap((user) => this.user$.next(user))
    );
    /*
    var self = this, params = {};
    //
    // we can now update different user
    if (cb === undefined) { cb = uid; uid = this.id; }
    if (uid === undefined) uid = this.id;
    backend.$user.save({ id: uid, action: 'payment' }, payment, function (u) {
      $rootScope.$broadcast("user.update.payment");
      self.payments = u.payments;
      if (cb) cb(self);
    });
    return this;
    */
  }

  // app.post('/v1/users/:id/payment/:alias/delete', users.ensureMeOrAdmin,users.deletePayment);
  public deletePaymentMethod(alias, uid): Observable<User> {
    const updatePayment = (uid) => {
      const user = this.cache.map.get(uid);
      user.payments = user.payments.filter((p) => p.alias !== alias);
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
      tap((user) => this.user$.next(user))
    );
    /*
    var self = this, params = {};
    //
    // we can now update different user
    if (cb === undefined) { cb = uid; uid = self.id; }
    if (uid === undefined) uid = this.id;
    backend.$user.save({ id: uid, action: 'payment', aid: alias, detail: 'delete' }, function () {
      for (var p in self.payments) {
        if (self.payments[p].alias === alias) {
          self.payments.splice(p, 1);
        }
      }
      $rootScope.$broadcast("user.update.payment");
      if (cb) cb(self);
    });
    return this;
    */
  }

  /**
   * ADMIN
   */
  // app.post('/v1/users/:id/status', auth.ensureAdmin,users.status);
  public updateStatus(id, status): Observable<User> {
    // var self = this, params = {};
    return this.http.post<User>(this.config.API_SERVER + '/v1/users/' + id + '/status', { status }, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      map((user) => new User(user)),
      tap((user) => this.user$.next(user))
    );
  }

  /**
   * Subscribe to the user stream.
   */
  public subscribe(
    onNext, onThrow?: ((exception: any) => void)|null,
    onReturn?: (() => void)|null): ISubscription {
      return this.user$.subscribe({next: onNext, error: onThrow, complete: onReturn});
  }

}
