import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';

import { Config } from './config';
import { ConfigService } from './config.service';

import { User, UserService } from './user.service';
import { CategoryService, Category } from './category.service';
import { Shop, ShopService } from './shop.service';

import { Observable, merge, combineLatest, throwError as _throw, ReplaySubject } from 'rxjs';

import { catchError, flatMap, map, publishReplay, refCount, filter, tap } from 'rxjs/operators';
import { CartService, CartState } from './cart.service';
import { OrderService } from './order/order.service';
import { Order } from './order/order';


//
// manage the first requests needed when bootstrapping the application. Used by the components.
@Injectable()
export class LoaderService {

  config$: Observable<Config>;

  // a BehaviorSubject can cache the last emited value so clients subscribing later can access the previously emitted data
  // private loader: BehaviorSubject<[Config, User]> = new BehaviorSubject<[Config, User]>([null,null]);
  //
  // Use better implementation
  // - http://jsbin.com/vapiroz/1/edit?js,console
  private loader: Observable<any>;
  private error: any;
  private preload: {
    categories: boolean;
    shops: boolean;
  };



  constructor(
    private $config: ConfigService,
    private $user: UserService,
    private $category: CategoryService,
    private $cart: CartService,
    private $shop: ShopService,
    private $order: OrderService
  ) {

    //
    // create a multicast Observable with the caching property of BehaviorSubject (publishbehavior)
    // every subscribing component will be connected to the same request and get the last item received
    // this.loader = new ReplaySubject<any[]>(1)
    //   .flatMap(this.preloader.bind(this));

    this.preload = {
      categories: (ConfigService.defaultConfig.loader.indexOf('categories') > -1),
      shops: (ConfigService.defaultConfig.loader.indexOf('shops') > -1)
    };

    //
    // install config obs
    this.config$ = this.$config.get();

    this.loader = this.config$.pipe(
      flatMap(this.preloader.bind(this)),
      //
      // transform observable to ConnectableObservable (multicasting)
      publishReplay(1),
      //
      // used to auto-connect to the source when there is >= 1 subscribers
      refCount(),
      catchError(err => {
        this.error = err;
        console.log('--- LOAD ERR', err);
        return _throw(err);
      })
    );
  }

  getError() {
    return this.error;
  }

  private preloader(config: Config) {
    const me$ = this.$user.me();

    //
    // preload cats
    if (this.preload.categories) {
      this.$category.select().subscribe();
      this.$category.categories$ = new ReplaySubject<Category[]>();
    }

    //
    // in case of preload shops, shops$ should block
    if (this.preload.shops) {
      this.$shop.query().subscribe();
      this.$shop.shops$ = new ReplaySubject<Shop[]>();
    }

    //
    // get last orders
    const catchError = true;
    this.$order.findOrdersByUser({id:1},{limit:4},catchError).subscribe();
    // let me$=merge(this.$user.me(),this.$user.user$);
    const loaders: any[] = [
      this.$config.config$,
      me$,
      this.$category.categories$,
      this.$shop.shops$,
      this.$order.orders$
    ];

    //
    // combineLatest to get array with last item of each when one emits an item
    // Config, User, Category[], Shop[]
    return combineLatest(loaders);
  }

  readyWithUser() {
    return combineLatest(this.$config.config$, this.$user.user$);
  }

  ready() {
    return this.loader;
  }

  readyWithStore() {
    return this.loader.pipe(
      filter(loader => {
        try {
          // 0 => cfg,
          // 1 => user
          // 2 => cats
          // 3 => shops
          const cfg = loader[0];
          const shops = loader[3];
          return !!cfg.shared.hub && !!shops;
        } catch (err) {
          return false;
        }
      })
    );
  }

  update(): Observable<{ config?: Config; user?: User; state?: CartState; shop?: Shop; orders?:Order[]; }> {
    let firstTime = false;
    return merge(
      this.$config.config$.pipe(map(config => ({ config }))),
      this.$user.user$.pipe(
        map(user => ({ user }))
      ),
      this.$cart.cart$.pipe(map(state => ({ state }))),
      this.$shop.shop$.pipe(map(shop => ({ shop }))),
      this.$order.orders$.pipe(map(orders => ({ orders }))),
    )
  }

}



//
// activate route only when loader is ready!
@Injectable()
export class LoaderResolve implements Resolve<Promise<any>> {
  constructor(private $loader: LoaderService) { }
  resolve(route: ActivatedRouteSnapshot) {
    return new Promise(resolve => {
      this.$loader.ready().subscribe((loader) => {
        resolve(loader);
      });
    });
  }
}

//
// activate route only when loader is ready!
@Injectable()
export class UserResolve implements Resolve<Promise<any>> {
  constructor(private $loader: LoaderService) { }
  resolve(route: ActivatedRouteSnapshot) {
    return new Promise(resolve =>{
      this.$loader.readyWithUser().subscribe(([config, user]) => {
        resolve([config, user]);
      });
    });
  }
}
