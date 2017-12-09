import { EventEmitter, Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from "rxjs/Rx";
import { Observable } from 'rxjs/Observable';
import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable'
import 'rxjs/Rx';

import { Config } from './config';
import { Product, ProductService  } from './product.service';
import { ConfigService } from './config.service';

import { User, UserCard, UserAddress, UserService } from './user.service';
import { Category, CategoryService } from './category.service';
import { Shop, ShopService } from './shop.service';

//manage the first requests needed when bootstrapping the application. Used by the components.
@Injectable()
export class LoaderService {

  // a BehaviorSubject can cache the last emited value so clients subscribing later can access the previously emitted data
  //private loader: BehaviorSubject<[Config, User]> = new BehaviorSubject<[Config, User]>([null,null]);
  private loader: Observable<any[]>;


  constructor(
    private http: Http,
    private $config: ConfigService,
    private $product: ProductService,
    private $user: UserService,
    private $category: CategoryService,
    private $shop: ShopService
  ) {

    //
    //create a multicast Observable with the caching property of BehaviorSubject (publishbehavior)
    //every subscribing component will be connected to the same request and get the last item received
    // this.loader = new ReplaySubject<any[]>(1)
    //   .flatMap(this.preloader.bind(this));

    this.loader = this.$config.init()
      .flatMap(this.preloader.bind(this))
      //
      // transform observable to ConnectableObservable (multicasting)
      .publishReplay(1)
      //
      // used to auto-connect to the source when there is >= 1 subscribers
      .refCount();      
  }

  private preloader(config:Config){
    let loaders:any[]=[
      Observable.of(config),
      this.$user.me()
    ];
    ConfigService.defaultConfig.loader.forEach(loader=>{
      if(loader==="shops"){
        loaders.push(this.$shop.query());
      }
      if(loader==="categories"){
        loaders.push(this.$category.select())
      }
    })
    //
    //combineLatest to get array with last item of each when one emits an item
    return Observable.combineLatest(loaders);      
  }
  

  ready() {
    return this.loader;
  }

}
