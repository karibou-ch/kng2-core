import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs/Rx';
import 'rxjs/add/observable/from';

// Cannot call a namespace ('moment')
// import * as moment from 'moment';
// https://stackoverflow.com/questions/39519823/using-rollup-for-angular-2s-aot-compiler-and-importing-moment-js
import  moment from 'moment';
//import Moment from 'moment';
import 'moment/locale/fr';

//
import { ConfigService } from './config.service';
import { Shop } from './shop.service';


export class UserAddress {

  constructor() {
  }
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
  }
}

export class UserCard {

  constructor() {
  }
  type: string;
  name: string;
  number: string;
  expiry: string;
  provider: string;
  alias: string;
}

export class User {

  deleted:boolean;
  id: string;

  /* The provider which with the user authenticated (facebook, twitter, etc.) */
  provider: string;

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

  birthday: Date;
  gender: string;
  tags: string[];
  url: string;

  phoneNumbers: [{
    number: string;
    what: string;
  }];

  photo: string;

  addresses: UserAddress[];

  /* preferred postalCode*/
  logistic: {
    postalCode: string;
  };


  /* preferred products*/
  likes: number[];

  /* The available Shop for this user */
  shops: Shop[];

  /* disqus sso */
  context: any;

  /* payments methods */
  payments: UserCard[];
  // payments:[{
  //   type:{type:String},
  //   name:{type:String},
  //   number:{type:String},
  //   expiry:{type:String},
  //   provider:{type:String,unique:true,required:true},
  //   alias:{type:String,unique:true,required:true}
  // }],

  merchant: boolean;

  reminder: {
    active: boolean;
    weekdays: number[];
    time: number;
  };


  status: boolean;
  created: Date;
  updated: Date;
  logged: Date;
  roles: string[];
  rank: string;

  constructor(json?: any) {
    let defaultUser = {

      name: {},
      tags: [],
      email: {
      },

      reminder: {
        weekdays: []
      },

      roles: [],
      shops: [],
      phoneNumbers: [{
        number: '',
        what: 'mobile'
      }],


      logistic: {}
    }
    Object.assign(this, json||defaultUser);

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

    //if (this.isAdmin())return true;
    for (var i in this.shops) {
      if (this.shops[i].name === shopname) {
        return true;
      }
    }
    return false;
  }

  isOwnerOrAdmin(shopname) {
    if (this.isAdmin())
      return true;
    return this.isOwner(shopname);
  }

  isAuthenticated() {
    return this.id !== '';
  }

  isAdmin() {
    return this.hasRole('admin');
  }

  isReady() {
    return (this.email && this.email.status === true);
  }

  hasRole(role) {
    for (var i in this.roles) {
      if (this.roles[i] === role) return true;
    }
    return false;
  }

  hasLike(product) {
    if (this.likes && this.likes.length) {
      if (this.likes.indexOf(product.sku) !== -1) {
        return true;
      }
    }
    // for (var i in this.likes){
    //   if (this.likes[i]==product.sku) return true;
    // }
    return false;
  }

  hasPrimaryAddress() {
    if (this.addresses && this.addresses.length == 1) return 0;
    for (var i in this.addresses) {
      if (this.addresses[i].primary === true)
        return i;
    }
    return false;
  }


  getEmailStatus() {
    if (!this.email || !this.email.status)
      return false;

    if (this.email.status === true)
      return true;

    return moment(this.email.status).format('ddd DD MMM YYYY');

  }


  populateAdresseName() {
    // autofill the address name when available
    if (this.addresses && this.addresses.length && !this.addresses[0].name) {
      this.addresses[0].name = this.name.familyName + ' ' + this.name.givenName;

    }
  }

  getBVR() {
    var self = this;
  }


  //
  // init user
  init() {
    var self = this;

    // set context for error

    if (!self.addresses) {
      return;
    }
    //check address
    self.populateAdresseName();

    // TODO get geo
    // self.geo=new Map();
    self.addresses.forEach(function(address, i) {
      // address is correct
      if (!address.geo || !address.geo.lat || !address.geo.lng) {
        return;
      }
      //
      //TODO setup marker
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
    map: Map<string, User>
    constructor() {
        this.list = [];
        this.map = new Map();
    }
}

@Injectable()
export class UserService {

  defaultUser: User = new User();

  // TODO make observable content !!
  config: any;
  currentUser: User = new User();
  private cache = new Cache();

  private updateCache(user: User) {
      if(!this.cache.map.get(user.id)){
          this.cache.map.set(user.id,new User(user))
          return this.cache.map.get(user.id);
      }
      return Object.assign(this.cache.map.get(user.id), user);
  }

  private deleteCache(user: User) {
      let incache=this.cache.map.get(user.id);
      if (incache) {
          incache.deleted=true;
          this.cache.map.delete(user.id);
      }
      return incache;
  }


  private headers: Headers;
  private user$: ReplaySubject<User>;

  constructor(
    public configSrv: ConfigService,
    public http: Http
  ) {
    this.config = ConfigService.defaultConfig;
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
    Object.assign(this.currentUser, this.defaultUser);
    this.user$ = new ReplaySubject<User>(1);
    this.user$.next(this.currentUser);
  }

  // token
  // https://github.com/neroniaky/angular2-token

  //
  // How to build Angular apps using Observable Data Services
  // http://blog.angular-university.io/how-to-build-angular2-apps-using-rxjs-observable-data-services-pitfalls-to-avoid/

  //get user data by his id
  get(id: number): Observable<User> {

    if (this.cache.map[id]) {
      return Observable.from(this.cache.map[id]);
    }

    return this.http.get(this.config.API_SERVER + '/v1/users/' + id, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => new User(res.json()))
      .map(user => this.updateCache(user))
      .catch(err => Observable.of(this.defaultUser));
    //   .map(res => res.json()).publishLast().refCount();

  }

  //
  //============================= REST api wrapper
  // TODO


  // app.get('/v1/users/me', auth.ensureAuthenticated, users.me);
  me(): Observable<User> {
    return this.http.get(this.config.API_SERVER + '/v1/users/me', {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()))
      .catch(err => Observable.of(this.defaultUser));

    // TODO check and remove those comments bellow
    //     // angular.extend(self,defaultUser);
    //     self.wrap(_u);
    //     // FIXME bad dependency circle
    //     self.shops=shop.wrapArray(self.shops);

    //     //
    //     // init
    //     self.init();

    //     //
    //     // broadcast info
    //     $rootScope.$broadcast("user.init",self);
    //     window.currentUser=self.email&&self.email.address||'Anonymous';

    //     if(cb)cb(self);
    //     return self;
    //   },(error) {
    //   if([0,401].indexOf(error.status)!==-1){
    //     self.copy(defaultUser);
    //   }
    //
    // );
  }

  // app.get('/v1/users', auth.ensureAdmin, users.list);
  query(filter?: any): Observable<User[]> {
    filter = filter || {};

    return this.http.get(this.config.API_SERVER + '/v1/users/', {
      search: filter,
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json().map(this.updateCache.bind(this)));
  }

  // Reçoit un statut de requête http
  // app.get ('/v1/validate/:uid/:email', emails.validate);
  validate(id, email): Observable<any> {
    return this.http.get(this.config.API_SERVER + '/v1/validate/' + id + '/' + email, {
      headers: this.headers,
      withCredentials: true
    });

  }

  // app.post('/v1/validate/create',auth.ensureAuthenticated, emails.create);
  validateEmail(email): Observable<any> {
    return this.http.post(this.config.API_SERVER + '/v1/validate/create', email, {
      headers: this.headers,
      withCredentials: true
    });
  }

  // app.post('/v1/recover/:token/:email/password', users.recover);
  recover(token, email, recover): Observable<any> {
    return this.http.post(this.config.API_SERVER + '/v1/recover/' + token + '/' + email + '/password', recover, {
      headers: this.headers,
      withCredentials: true
    });
  }



  // app.post('/v1/users/:id', users.ensureMeOrAdmin,users.update);
  save(user): Observable<User> {
    // autofill the address name when available
    user.populateAdresseName();
    return this.http.post(this.config.API_SERVER + '/v1/users/' + user.id, user, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()))
      .catch(err => Observable.of(this.defaultUser));

    // TODO inform consumers of user change
    // $rootScope.$broadcast("user.update",_user);

  }

  // app.get ('/logout', auth.logout);
  logout(): Observable<User> {
    return this.http.get(this.config.API_SERVER + '/logout/', {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.defaultUser)
      .catch(err => Observable.of(this.defaultUser))
    // TODO inform consumers of user change
    // $rootScope.$broadcast("user.update",_user);
  }

  // TODO voir lignes commentées (updateGeoCode etc.)
  // app.post('/register', queued(auth.register_post));
  register(user): Observable<User> {
    // TODO deprecated, this should be done in component
    //user.populateAdresseName();
    return this.http.post(this.config.API_SERVER + '/register', user, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()))
      .catch(err => Observable.of(this.defaultUser));
    // _user.copy(u);
    // _user.updateGeoCode();
  };

  // app.post('/v1/users/:id/password',users.ensureMe, users.password);
  newpassword(id, change): Observable<any> {
    return this.http.post(this.config.API_SERVER + '/v1/users/' + id + '/password', change, {
      headers: this.headers,
      withCredentials: true
    });
  };

  // TODO voir lignes commentées (updateGeoCode etc.) + Broadcast
  // app.post('/login', queued(auth.login_post));
  login(data): Observable<User> {
    return this.http.post(this.config.API_SERVER + '/login', data, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()))
      .catch(err => Observable.of(this.defaultUser));
    /*
    TODO check and remove comments bellow
    _user.copy(u);
    _user.updateGeoCode();
    $rootScope.$broadcast("user.init",self);
    */
  };


  // app.put('/v1/users/:id', auth.ensureAdmin, auth.checkPassword, users.remove);
  remove(id, password): Observable<any> {
    return this.http.put(this.config.API_SERVER + '/v1/users/', { password: password }, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.deleteCache(res.json()));
    //self.delete();
    //$rootScope.$broadcast("user.remove",self);
  }

  // app.post('/v1/users/:id/like/:sku', users.ensureMe, users.like);
  love(id, product): Observable<User> {
    //var self=this, params={};
    return this.http.post(this.config.API_SERVER + '/v1/users/' + id + '/like/' + product.sku, null, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()))
    // TODO check updateCache and user likes
    // .map(user => {
    //   this.cache.list.find(u => u.id === user.id).likes = user.likes.slice();
    //   this.cache.map.get(user.id).likes = user.likes.slice();
    //   return user;
    // })
  }
  //================================================

  geocode(street, postal, region): Observable<any> {
    // google format: Route de Chêne 34, 1208 Genève, Suisse
    if (!region) region = "Suisse";
    var fulladdress = street + "," + postal + ", " + region;//"34+route+de+chêne,+Genève,+Suisse
    var url = "//maps.googleapis.com/maps/api/geocode/json?address=" + fulladdress + "&sensor=false";
    return this.http.get(url, { withCredentials: false })
      .map(res => res.json());
  }

  //boucle observables, map met a jour l'adresse, liste observable, merge ou concat, subscribe(TODO notify success or error)
  updateGeoCode(user: User): Observable<any> {
    let obs:any[] = [], self = this;
    //let dirty = false;
    // check state
    if ("obj" in user) {
      return Observable.of(user);
    }
    if (user.addresses.length === 0 || user.addresses.length && user.addresses[0].geo && user.addresses[0].geo.lat) {
      return Observable.of(user);
    }

    // get geo lt/lng
    // TODO default value for GeoLocation
    if (!user.addresses[0].geo) user.addresses[0].geo = { lat: 0, lng: 0};

    //build an array of observables
    //TODO please refactor this code !
    user.addresses.forEach((address, i) => {
      obs.push(
        this.geocode(address.streetAdress, address.postalCode, address.region)
        .map(geo => {
          if (!geo.results.length || !geo.results[0].geometry) {
            return;
          }
          if (!geo.results[0].geometry.lat) {
            return;
          }
          address.geo = { 
            lat: geo.results[0].geometry.location.lat, 
            lng: geo.results[0].geometry.location.lng 
          };
        })
      );
    });

    //on encapsule tout dans un observable et on y souscrit
    return Observable.from(obs);

    // ==== méthodes alternative pour ce cas là =========
    /*
      return Observable.from(user.addresses)
        .concatMap(address => {
          return this.geocode(address.streetAdress, address.postalCode, address.region);
        })
        .map((geo, i) => {
          if (!geo.results.length || !geo.results[0].geometry) {
              return;
            }
            if (!geo.results[0].geometry.lat) {
              return;
            }
            user.addresses[i].geo = { lat: null, lng: null };
            user.addresses[i].geo.lat = geo.results[0].geometry.location.lat;
            user.addresses[i].geo.lng = geo.results[0].geometry.location.lng;
        });
      */

  }

  /**
   * payment methods
   */
  // app.post('/v1/users/:id/payment/:alias/check', users.ensureMeOrAdmin,users.checkPaymentMethod);
  checkPaymentMethod(user): Observable<User> {

    let allAlias = user.payments.map(payment => { return payment.alias; });
    let alias = allAlias.pop();

    return this.http.post(this.config.API_SERVER + '/v1/users/' + user.id + '/payment/' + alias + '/check', allAlias, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()));
    /*
    TODO check comment bellow concerning payment method check
    var self = this, allAlias = [], alias;
    if (!self.payments || !self.payments.length) {
      return cb({});
    }
    allAlias = self.payments.map(function (payment) {
      return payment.alias;
    });
    alias = allAlias.pop();
    backend.$user.save({ id: this.id, action: 'payment', aid: alias, detail: 'check' }, { alias: allAlias }, function (methodStatus) {
      if (cb) cb(methodStatus);
    }, function (error) {
      if ([0, 401].indexOf(error.status) !== -1) {
        self.copy(defaultUser);
      }

    });
    return this;
    */
  }

  // app.post('/v1/users/:id/payment', users.ensureMeOrAdmin,users.addPayment);
  addPaymentMethod(payment, uid): Observable<User> {
    return this.http.post(this.config.API_SERVER + '/v1/users/' + uid + '/payment', payment, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()));
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
  deletePaymentMethod(alias, uid): Observable<User> {
    return this.http.post(this.config.API_SERVER + '/v1/users/' + uid + '/payment/' + alias + '/delete', null, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()))
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
  updateStatus(id, status): Observable<User> {
    //var self = this, params = {};
    return this.http.post(this.config.API_SERVER + '/v1/users/' + id + '/status', { status: status }, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => this.updateCache(res.json()));
  }
  


}
