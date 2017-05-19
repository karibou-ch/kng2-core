import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';

import * as moment from 'moment';
//import Moment from 'moment';
import 'moment/locale/fr';

//
import { ConfigService } from './config.service';


// TEMP CLASS TO AVOID IMPORT ERROR
export class Shop{
  name:string;
  constructor(){}
};

export class User{
    id:string;

    /* The provider which with the user authenticated (facebook, twitter, etc.) */
    provider:string;

    email:{
      address:string;
      cc:string;
      status:any;
    };

    /* The name of this user, suitable for display.*/
    displayName:string;
    name: {
        familyName:string;
        givenName:string;
    };

    birthday:Date;
    gender:string;
    tags:string[];
    url:string;

    phoneNumbers: [{
        number:string;
        what:string;
    }];

    photo: string;

    addresses: [{
          name: string;
          note: string;
          floor: string;
          streetAdress: string;
          region: string;
          postalCode: string;
          primary:boolean;
          geo:{
            lat:number;
            lng:number;
          }
    }];

    /* preferred postalCode*/
    logistic:{
      postalCode:string;
    };


    /* preferred products*/
    likes:number[];

    /* The available Shop for this user */
    shops:Shop[];

    /* disqus sso */
    context:any;

    /* payments methods */
    payments:any[];
    // payments:[{
    //   type:{type:String},
    //   name:{type:String},
    //   number:{type:String},
    //   expiry:{type:String},
    //   provider:{type:String,unique:true,required:true},
    //   alias:{type:String,unique:true,required:true}
    // }],

    merchant:boolean;

    reminder:{
      active:boolean;
      weekdays:number[];
      time:number;
    };


    status:boolean;
    created:Date;
    updated:Date;
    logged:Date;
		roles:string[];
    rank:string;



  //
  // methods
  display(){
    if (this.displayName){
      return this.displayName;
    }
    if (this.name && (this.name.givenName || this.name.familyName)) {
      return this.name.givenName+' '+this.name.familyName;
    }
    if (this.id){
      return this.id+'@'+this.provider;
    }
    return 'Anonymous';
  }


  loggedTime() {
    return (Date.now()-(new Date(this.logged)).getTime())/1000;
  }

  isOwner(shopname){

      //if (this.isAdmin())return true;
      for (var i in this.shops) {
        if (this.shops[i].name === shopname) {
          return true;
        }
      }
      return false;
  }

  isOwnerOrAdmin(shopname){
    if(this.isAdmin())
      return true;
    return this.isOwner(shopname);
  }

   isAuthenticated () {
      return this.id !== '';
  }

   isAdmin () {
    return this.hasRole('admin');
  }

  isReady(){
    return (this.email&&this.email.status === true);
  }

   hasRole (role) {
      for (var i in this.roles){
        if (this.roles[i]===role) return true;
      }
      return false;
  }

   hasLike (product) {
      if(this.likes&&this.likes.length){
        if(this.likes.indexOf(product.sku)!==-1){
          return true;
        }
      }
      // for (var i in this.likes){
      //   if (this.likes[i]==product.sku) return true;
      // }
      return false;
  }

   hasPrimaryAddress () {
      if (this.addresses&&this.addresses.length==1)return 0;
      for (var i in this.addresses){
        if (this.addresses[i].primary===true)
          return i;
      }
      return false;
  }


  getEmailStatus(){
    if(!this.email||!this.email.status)
      return false;

    if(this.email.status===true)
      return true;

    return moment(this.email.status).format('ddd DD MMM YYYY');

  }

  populateAdresseName(){
    // autofill the address name when available
    if(this.addresses&&this.addresses.length&&!this.addresses[0].name){
      this.addresses[0].name=this.name.familyName+' '+this.name.givenName;
    }
  }

  getBVR(){
    var self=this;
  }

  //
  // init user 
  init () {
    var self=this;

    // set context for error

    if(!self.addresses){
      return;
    }
    //check address
    self.populateAdresseName();

    // TODO get geo 
    // self.geo=new Map();
    self.addresses.forEach(function(address,i){
      // address is correct
      if(!address.geo||!address.geo.lat||!address.geo.lng){
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
  defaultUser:User = new User();
  // defaultUser:User = {
  //   id: '',
  //   name: {
  //     givenName: '',
  //     familyName: '',
  //   },
  //   email: {},
  //   reminder:{weekdays:[]},
  //   roles: [],
  //   shops: [],
  //   provider: '',
  //   url: '',
  //   phoneNumbers:[{what:'mobile'}],
  //   addresses:[],
  //   logistic:{
  //     postalCode:[]
  //   }
  // };

    private cache: {
    list: User[];
    map: Map<number, User>; 
  }
  private updateCache(user:User){

  }

  private deleteCache(user:User){

  }

  private addCache(user:User){
    //
    //check if already exist on cache and add in it if not the case
    if (!this.cache.map[user.id]){
      this.cache.map[user.id] = user;
      this.cache.list.push(user);
      return;
    }
    //update existing entry
    return Object.assign(this.cache.map[user.id], user);    
  }

  private headers:Headers;

  constructor(
    public config:ConfigService,
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
  get(id:number):Observable<User> {

    if (this.cache.map[id]){
      return Observable.from(this.cache.map[id]);
    }

    return this.http.get(this.config.API_SERVER+'/v1/users/'+id,{headers:this.headers})
        .map(res => res.json()).publishLast().refCount();
  }

  //
  //============================= REST api wrapper
  // TODO

  // app.get('/v1/users/me', auth.ensureAuthenticated, users.me);
  me(): Observable<User> {
    //var self=this;


     return this.http.get(this.config.API_SERVER+'/v1/users/me',{
       headers:this.headers,
       withCredentials: true
      })
          .map(res => res.json() as User)
          .map(user => this.addCache(user))
          .catch(err=> Observable.of(this.defaultUser));
        
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
   query(filter?: any):Observable<User[]> {
    filter = filter || {};

    return this.http.get(this.config.API_SERVER + '/v1/users/', {
      search: filter,
      headers: this.headers,
      withCredentials: true
    })
      .map(res => res.json() as User[])
      .map(users => users.map(user=>this.addCache(user)));
  }

  // Reçoit un statut de requête http
  // app.get ('/v1/validate/:uid/:email', emails.validate);
  validate(id, email):Observable<any> {
    return this.http.get(this.config.API_SERVER+'/v1/validate/'+ id + '/'+email, {
      headers:this.headers,
      withCredentials: true
    });
    
  }

// app.post('/v1/validate/create',auth.ensureAuthenticated, emails.create);
  validateEmail(email):Observable<any>{
    return this.http.post(this.config.API_SERVER+'/v1/validate/create',email, {
      headers:this.headers,
      withCredentials: true
    });
  }

// app.post('/v1/recover/:token/:email/password', users.recover);
  recover(token, email, recover):Observable<any>{
    return this.http.post(this.config.API_SERVER+'/v1/recover/'+token+'/'+email+'/password',recover,{
      headers:this.headers,
      withCredentials: true
    });
  }



// app.post('/v1/users/:id', users.ensureMeOrAdmin,users.update);
  save(user):Observable<User>{
    // autofill the address name when available
    user.populateAdresseName(); 
    return this.http.post(this.config.API_SERVER + '/v1/users/'+user.id, user, {
      headers:this.headers,
      withCredentials: true
    })
    .map(res => res.json() as User)
    .catch(err=> Observable.of(this.defaultUser));

  // TODO inform consumers of user change
  // $rootScope.$broadcast("user.update",_user);

  }

// app.get ('/logout', auth.logout);
logout():Observable<User>{
    return this.http.get(this.config.API_SERVER + '/logout/', {
      headers:this.headers,
      withCredentials: true
    })
    .map(res => this.defaultUser as User)
    .catch(err=> Observable.of(this.defaultUser));
  // TODO inform consumers of user change
  // $rootScope.$broadcast("user.update",_user);
    
  }

// TODO voir lignes commentées (updateGeoCode etc.)
// app.post('/register', queued(auth.register_post));
  register(user):Observable<User>{

    // FIXME autofill the address name when available
    user.populateAdresseName();
    return this.http.post(this.config.API_SERVER+'/register',user, {
      headers:this.headers
      //withCredentials: true
    })
    .map(res => res.json() as User)
    .catch(err=> Observable.of(this.defaultUser));
     // _user.copy(u);
     // _user.updateGeoCode();

  };

  // app.post('/v1/users/:id/password',users.ensureMe, users.password);
  newpassword(id, change):Observable<any>{
    return this.http.post(this.config.API_SERVER + '/v1/users/'+id+'/password',change, {
      headers:this.headers,
      withCredentials: true
    });
  };

// TODO voir lignes commentées (updateGeoCode etc.) + Broadcast
// app.post('/login', queued(auth.login_post));
login(data):Observable<User>{
    return this.http.post(this.config.API_SERVER+'/login', data,{
      headers:this.headers
    })
    .map(res => res.json() as User)
    .catch(err=> Observable.of(this.defaultUser));
      /*
      _user.copy(u);
      _user.updateGeoCode();
      $rootScope.$broadcast("user.init",self);
      */
  };

  //
  // TODO move this action to the shop service
  // app.post('/v1/shops', auth.ensureUserValid, shops.ensureShopLimit, shops.create);
  createShop(shop):Observable<Shop>{
    return this.http.post(this.config.API_SERVER+'/v1/shops', shop, {
      headers:this.headers,
      withCredentials: true
    })
    .map(res => res.json as Shop);
     // _user.shops.push(s);
      
  };

  // app.put('/v1/users/:id', auth.ensureAdmin, auth.checkPassword, users.remove);
  remove(id, password):Observable<any>{
    return this.http.put(this.config.API_SERVER+'/v1/users/',{password:password},{
      headers:this.headers,
      withCredentials: true
    });
      //self.delete();
      //$rootScope.$broadcast("user.remove",self);
      
  };

  // app.post('/v1/users/:id/like/:sku', users.ensureMe, users.like);
  love(id,product):Observable<User>{
    //var self=this, params={};
    return this.http.post(this.config.API_SERVER+'/v1/users/'+id+'/like/'+product.sku,{
      headers:this.headers,
      withCredentials: true
    })
    .map(res => res.json() as User)
    .catch(err=> Observable.of(this.defaultUser));
      //self.copy(u);
      //$rootScope.$broadcast("user.update.love",self);

   // return this;
  };
//================================================

  updateGeoCode=function () {
    var promises=[], dirty=false, self=this;
    // check state
    if(self.geo){
      return;
    }
    if(self.addresses.length===0||self.addresses.length && self.addresses[0].geo && self.addresses[0].geo.lat){
      return;
    }

    //
    // get geo lt/lng
    if(!self.geo)self.geo=new Map();


    self.addresses.forEach(function(address,i){
      // address is correct
      if(address.geo&&address.geo.lat&&address.geo.lng){
        return;
      }

      promises.push(self.geo.geocode(address.streetAdress, address.postalCode, address.country, function(geo){
        if(!geo.results.length||!geo.results[0].geometry){
         return;
        }
        if(!geo.results[0].geometry.lat){
          return;
        }

        //
        //update data
        address.geo={};
        address.geo.lat=geo.results[0].geometry.location.lat;
        address.geo.lng=geo.results[0].geometry.location.lng;

        //
        //setup marker
        self.geo.addMarker(i,{
          lat:address.geo.lat,
          lng:address.geo.lng,
          message:address.streetAdress+'/'+address.postalCode
        });


        dirty=true;
      }));// end of promise
    }); // end of forEach

    // should we save the user?
    $q.all(promises).finally(function () {
      $log('save user geo map',dirty);
      if(dirty)self.save();
    });


  };




}
