import { EventEmitter, Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';

import { Config } from './config';
import { Product, ProductService  } from './product.service';
import { ConfigService } from './config.service';

import { User, UserCard, UserAddress, UserService } from './user.service';
import { Category, CategoryService } from './category.service';
import { Shop, ShopService } from './shop.service';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { merge } from 'rxjs/observable/merge';
import { combineLatest } from 'rxjs/observable/combineLatest';

import { catchError, flatMap, map, publishReplay, refCount } from 'rxjs/operators';
import { CartService, CartState } from './cart.service';
import { _throw } from 'rxjs/observable/throw';



//manage the first requests needed when bootstrapping the application. Used by the components.
@Injectable()
export class LoaderService {

  // a BehaviorSubject can cache the last emited value so clients subscribing later can access the previously emitted data
  //private loader: BehaviorSubject<[Config, User]> = new BehaviorSubject<[Config, User]>([null,null]);
  //
  // Use better implementation
  // - http://jsbin.com/vapiroz/1/edit?js,console
  private loader: Observable<any>;
  private error:any;
  


  constructor(
    private $config: ConfigService,
    private $product: ProductService,
    private $user: UserService,
    private $category: CategoryService,
    private $cart: CartService,
    private $shop: ShopService
  ) {

    //
    //create a multicast Observable with the caching property of BehaviorSubject (publishbehavior)
    //every subscribing component will be connected to the same request and get the last item received
    // this.loader = new ReplaySubject<any[]>(1)
    //   .flatMap(this.preloader.bind(this));

    this.loader = this.$config.get().pipe(
      flatMap(this.preloader.bind(this)),
      //
      // transform observable to ConnectableObservable (multicasting)
      publishReplay(1),
      //
      // used to auto-connect to the source when there is >= 1 subscribers
      refCount(),
      catchError(err=>{
        this.error=err;       
        return _throw(err);
      })
    );
  }

  getError(){
    return this.error;
  }

  private preloader(config:Config){
    let me$=this.$user.me();
    let loaders:any[]=[
      of(config),
      me$,  // howto merge this.$user.user$,      
      // this.$user.me(),      
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
    return combineLatest(loaders);  
  }

  ready() {
    return this.loader;
  }

  
  update():Observable<{config?:Config;user?:User;state?:CartState;shop?:Shop}>{
    return merge(
      this.$config.config$.pipe(map(config=>({config:config}))),
      this.$user.user$.pipe(map(user=>({user:user}))),
      this.$cart.cart$.pipe(map(state=>({state:state}))),
      this.$shop.shop$.pipe(map(shop=>({shop:shop})))
    )
  }

}



//
// activate route only when loader is ready!
@Injectable()
export class LoaderResolve implements Resolve<Promise<any>> {
  constructor(private $loader: LoaderService) {}
  resolve(route: ActivatedRouteSnapshot) {
    return this.$loader.ready().toPromise();
  }
}
