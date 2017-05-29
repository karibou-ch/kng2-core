import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/from';
import Rx from 'rxjs/Rx';

import * as moment from 'moment';
//import Moment from 'moment';
import 'moment/locale/fr';

//
import { ConfigService } from './config.service';


// TEMP CLASS TO AVOID IMPORT ERROR
export class Shop {
  name: string;
  constructor() { }
};

export class User {
  constructor() {
    this.id = '';
    this.displayName = '';
    this.name = {
      givenName: '',
      familyName: '',
    };
    this.birthday = new Date();
    this.gender = '';
    this.tags = [];
    this.url = '';

    this.email = {
      address: '',
      cc: '',
      status: ''
    };

    this.reminder = {
      active: false,
      weekdays: [],
      time: null
    };

    this.roles = [];
    this.shops = [];
    this.provider = '';
    this.url = '';

    this.phoneNumbers = [{
      number: '',
      what: 'mobile'
    }];

    this.photo = '';

    this.addresses = [{
      name: '',
      note: '',
      floor: '',
      streetAdress: '',
      region: '',
      postalCode: '',
      primary: false,
      geo: {
        lat: null,
        lng: null
      }
    }];

    this.logistic = {
      postalCode: ''
    };



  }


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

  addresses: [{
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
  }];

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
  payments: any[];
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
    self.addresses.forEach(function (address, i) {
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

@Injectable()
export class UserService {
  defaultUser: User = new User();


  private cache: {
    list: User[];
    map: Map<string, User>;
  }

  private deleteCache(user: User) {
    if (this.cache.map[user.id]) {
      this.cache.map.delete(user.id);
      let index = this.cache.list.indexOf(user)
      if (index > -1)
        this.cache.list.splice(index, 1);
    }
  }

  private updateCache(user: User): User {
    //
    //check if already exist on cache and add in it if not the case
    if (!this.cache.map[user.id]) {
      this.cache.map[user.id] = user;
      this.cache.list.push(user);
      return user;
    }
    //update existing entry
    return Object.assign(this.cache.map[user.id], user);
  }

  private headers: Headers;

  constructor(
    public config: ConfigService,
    public http: Http
  ) {
    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
  }

  // token
  // https://github.com/neroniaky/angular2-token

  //
  // How to build Angular apps using Observable Data Services
  // http://blog.angular-university.io/how-to-build-angular2-apps-using-rxjs-observable-data-services-pitfalls-to-avoid/
  get(id: number): Observable<User> {

    if (this.cache.map[id]) {
      return Observable.from(this.cache.map[id]);
    }

    return this.http.get(this.config.API_SERVER + '/v1/users/' + id, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as User)
      .map(user => this.updateCache(user))
      .catch(err => Observable.of(this.defaultUser));
    //   .map(res => res.json()).publishLast().refCount();
  }

  //
  //============================= REST api wrapper
  // TODO

  // app.get('/v1/users/me', auth.ensureAuthenticated, users.me);
  me(): Observable<User> {
    //var self=this;


    return this.http.get(this.config.API_SERVER + '/v1/users/me', {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as User)
      .map(user => this.updateCache(user))
      .catch(err => Observable.of(this.defaultUser));

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
      .map(res => res.json() as User[])
      .map(users => users.map(user => this.updateCache(user)));
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
      .map(res => res.json() as User)
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
      .catch(err => Observable.of(this.defaultUser));
    // TODO inform consumers of user change
    // $rootScope.$broadcast("user.update",_user);

  }

  // TODO voir lignes commentées (updateGeoCode etc.)
  // app.post('/register', queued(auth.register_post));
  register(user): Observable<User> {

    // FIXME autofill the address name when available
    user.populateAdresseName();
    return this.http.post(this.config.API_SERVER + '/register', user, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as User)
      .map(user => this.updateCache(user))
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
      .map(res => res.json() as User)
      .map(user => this.updateCache(user))
      .catch(err => Observable.of(this.defaultUser));
    /*
    _user.copy(u);
    _user.updateGeoCode();
    $rootScope.$broadcast("user.init",self);
    */
  };

  //
  // TODO move this action to the shop service
  // app.post('/v1/shops', auth.ensureUserValid, shops.ensureShopLimit, shops.create);
  createShop(shop): Observable<Shop> {
    return this.http.post(this.config.API_SERVER + '/v1/shops', shop, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json as Shop);
    // _user.shops.push(s);

  };

  // app.put('/v1/users/:id', auth.ensureAdmin, auth.checkPassword, users.remove);
  remove(id, password): Observable<any> {
    return this.http.put(this.config.API_SERVER + '/v1/users/', { password: password }, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as User)
      .map(user => this.deleteCache(user));
    //self.delete();
    //$rootScope.$broadcast("user.remove",self);

  };

  // app.post('/v1/users/:id/like/:sku', users.ensureMe, users.like);
  love(id, product): Observable<User> {
    //var self=this, params={};
    return this.http.post(this.config.API_SERVER + '/v1/users/' + id + '/like/' + product.sku, null, {
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as User)
      .map(user => {
        this.cache.list.find(u => u.id === user.id).likes = user.likes.slice();
        this.cache.map.get(user.id).likes = user.likes.slice();
      })
      .catch(err => Observable.of(this.defaultUser));
    //self.copy(u);
    //$rootScope.$broadcast("user.update.love",self);

    // return this;
  };
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
  updateGeoCode(user) {
    let obs = [], self = this;
    //let dirty = false;
    // check state
    if (user.geo) {
      return;
    }
    if (user.addresses.length === 0 || user.addresses.length && user.addresses[0].geo && user.addresses[0].geo.lat) {
      return;
    }

    // get geo lt/lng
    if (!user.addresses[0].geo) user.addresses[0].geo = { lat: null, lng: null };

    //on construit le tableau d'observables
    user.addresses.forEach(function (address, i) {
      obs.push(this.geocode(address.streetAdress, address.postalCode, address.region)
        .map(geo => {
          if (!geo.results.length || !geo.results[0].geometry) {
            return;
          }
          if (!geo.results[0].geometry.lat) {
            return;
          }
          address.geo = { lat: null, lng: null };
          address.geo.lat = geo.results[0].geometry.location.lat;
          address.geo.lng = geo.results[0].geometry.location.lng;

          //     //
          //     //setup marker
          user.geo.addMarker(i, {
            lat: address.geo.lat,
            lng: address.geo.lng,
            message: address.streetAdress + '/' + address.postalCode
          });

        }));
    });

    //on encapsule tout dans un observable et on y souscrit
    let sub = Observable.from(obs);
    sub.subscribe();

  //   Observable.forkJoin(
  //     user.addresses.map(
  //       address => {return this.geocode(address.streetAdress, address.postalCode, address.region);}
  //   ))

  //  // Observable.from(user.addresses)
  //   .concatMap(address => this.geocode(address.streetAdress, address.postalCode, address.region))
    
      /*
      //     //
      //     //update data
      address.geo = { lat: null, lng: null };
      address.geo.lat = geo.results[0].geometry.location.lat;
      address.geo.lng = geo.results[0].geometry.location.lng;

      //     //
      //     //setup marker
      user.geo.addMarker(i, {
        lat: address.geo.lat,
        lng: address.geo.lng,
        message: address.streetAdress + '/' + address.postalCode
      });
      //  dirty = true;
    


    user.addresses.forEach(function (address, i) {
      //   // address is correct
      if (address.geo && address.geo.lat && address.geo.lng) {
        return;
      }

      obs.push(this.geocode(address.streetAdress, address.postalCode, address.region));// end of promise
    }); // end of forEach

    let merged = Rx.Observable.merge(obsArray);

    merged.subscribe((geo) => {
      if (!geo.results.length || !geo.results[0].geometry) {
        return;
      }
      if (!geo.results[0].geometry.lat) {
        return;
      }

      //     //
      //     //update data
      address.geo = { lat: null, lng: null };
      address.geo.lat = geo.results[0].geometry.location.lat;
      address.geo.lng = geo.results[0].geometry.location.lng;

      //     //
      //     //setup marker
      user.geo.addMarker(i, {
        lat: address.geo.lat,
        lng: address.geo.lng,
        message: address.streetAdress + '/' + address.postalCode
      });


      dirty = true;
    })
      * /
    /*
   // // should we save the user?
    $q.all(promises).finally(function () {
      $log('save user geo map', dirty);
      if (dirty) self.save();
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
      .map(res => res.json() as User)
      .map(user => this.updateCache(user))
      .catch(err => Observable.of(this.defaultUser));;


    /*
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
      .map(res => res.json() as User)
      .map(user => this.updateCache(user))
      .catch(err => Observable.of(this.defaultUser));
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
      .map(res => res.json() as User)
      .map(user => this.updateCache(user))
      .catch(err => Observable.of(this.defaultUser));
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
      .map(res => res.json() as User)
      .map(user => this.updateCache(user))
      .catch(err => Observable.of(this.defaultUser));
  }
  //self.copy(u);



}
