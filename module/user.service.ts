import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';

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

  populateAdresseName(user?) {
    if (!user) user = this;
    // autofill the address name when available
    if (user.addresses && user.addresses.length && !user.addresses[0].name) {
      user.addresses[0].name = user.name.familyName + ' ' + user.name.givenName;
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

  private defaultUser = {
    id: '',
    name: {
      givenName: '',
      familyName: '',
    },
    email: {},
    reminder: { weekdays: [] },
    roles: [],
    shops: [],
    provider: '',
    url: '',
    phoneNumbers: [{ what: 'mobile' }],
    addresses: [],
    logistic: {
      postalCode: []
    }
  };

  private headers: Headers;


  private cache:Map<string,User>;

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
  ge(id: number) {
    return this.http.get(this.config.API_SERVER + '/v1/users/:id/:action/:aid/:detail', { headers: this.headers })
      .map(res => res.json()).publishLast().refCount();
  }

  //
  // REST api wrapper
  // TODO
  me(cb) {
    var self = this;
    return this.chain(backend.$user.get({ id: 'me' }, function (_u, headers) {
      angular.extend(self, defaultUser);
      self.wrap(_u);
      // FIXME bad dependency circle
      self.shops = shop.wrapArray(self.shops);

      // init
      self.init();

      // broadcast info
      $rootScope.$broadcast("user.init", self);
      window.currentUser = self.email && self.email.address || 'Anonymous';

      if (cb) cb(self);
      return self;
    }, (error) {
      if ([0, 401].indexOf(error.status) !== -1) {
        self.copy(defaultUser);
      }
    }).$promise
    );
  };


}
