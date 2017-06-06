import { Http, Headers } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';

export class Shop {
  name: string;
  constructor() { }
};

// @Injectable()
// export class ShopService {

//     private defaultShop = {
//     url:'',
//     photo:{},
//     options:{},
//     available:{},
//     address:{},
//     info:{},
//     account:{},
//     faq:[]
//   };

//     private headers:Headers;

//     constructor(private http: Http, data){
//         //TODO resource method
//           // this is the restfull backend for angular 
//           /*
//         var backend=$resource(config.API_SERVER+'/v1/shops/:urlpath/:action',
//                 {category:'@id', action:'@action'}, {
//                 update: {method:'POST'},
//                 delete: {method:'PUT'},
//         });
//         */
        
//         this = api.wrapDomain(this, 'urlpath', this.defaultShop)

//     }

//     private checkimg(s){
//         if(!s.photo){
//         s.photo={fg:''};
//       }
//     }

//     //
//     // REST api wrapper
//     //

//     query(filter,cb,err) {
//         var shops, s,self=this, params={};
//         Object.assign(params, filter);
//         s=backend.query(params, function() {
//         shops=self.wrapArray(s);
//         if(cb)cb(shops);
//         });
//         return s;
//     };

//     findByCatalog(cat, filter,cb,err) {
//         var shops, s,self=this;
//         Object.assign(params, filter,{urlpath:'category',action:cat});      
//         s=backend.query(filter, function() {
//         shops=self.wrapArrayp(s);
//         if(cb)cb(shops);
//         });
//         return shops;
//     };


//     get(urlpath,cb) {
//         var self=this;      
//         var s=backend.get({urlpath:urlpath},function() {
//         checkimg(s);
//         self.wrap(s);
//         if(cb)cb(self);
//         });
//         return this;
//     };


//     publish(cb,err) {
//         if(!err) err=function(){};
//         var me=this, s = $resource(config.API_SERVER+'/v1/shops/:urlpath/status',{urlpath:this.urlpath}).get(function() {
//         if(cb)cb(me);
//         },err);
//         return this;
//     };    

//     ask(content, cb,err) {
//         if(!err) err=function(){};
//         var me=this, s = $resource(config.API_SERVER+'/v1/shops/:urlpath/ask',{urlpath:this.urlpath}).save({content:content},function() {
//         if(cb)cb(me);
//         },err);
//         return this;
//     };    

//     save( cb, err){
//         if(!err) err=function(){};
//         var me=this, s=backend.save({urlpath:this.urlpath},this, function() {
//         $rootScope.$broadcast("shop.update",me);
//         if(cb)cb(me.wrap(s));
//         },err);
//         return this;
//     };

//     create(user, data,cb){
//         // if(!err) err=function(){};
//         var me=this, s = backend.save(data, function() {
//         var shop=me.wrap(s);
//         user.shops.push(shop);
//         if(cb)cb(shop);
//         });
//         return this;
//     };    

//     remove(user,password,cb,err){
//         if(!err) err=function(){};
//         var me=this, s = backend.delete({urlpath:this.urlpath},{password:password},function() {
//         user.shops.pop(me);
//         $rootScope.$broadcast("shop.remove",me);
//         if(cb)cb(me);
//         },err);
//         return this;
//     };    

// }
