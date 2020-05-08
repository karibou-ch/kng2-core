import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';

import { Config } from './config';
import { ConfigService } from './config.service';

import { User, UserService } from './user.service';
import { CategoryService } from './category.service';
import { Shop, ShopService } from './shop.service';

import { Observable, of, merge, combineLatest, throwError as _throw } from 'rxjs';

import { catchError, flatMap, map, publishReplay, refCount, tap, filter } from 'rxjs/operators';
import { CartService, CartState } from './cart.service';


//
// manage the first requests needed when bootstrapping the application. Used by the components.
@Injectable()
export class LoaderService {

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
    private $shop: ShopService
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

    this.loader = this.$config.get().pipe(
      flatMap(this.preloader.bind(this)),
      //
      // transform observable to ConnectableObservable (multicasting)
      publishReplay(1),
      //
      // used to auto-connect to the source when there is >= 1 subscribers
      refCount(),
      catchError(err => {
        this.error = err;
        return _throw(err);
      })
    );
  }

  getError() {
    return this.error;
  }

  private preloader(config: Config) {
    const me$ = this.$user.me();

    // let me$=merge(this.$user.me(),this.$user.user$);
    const loaders: any[] = [
      this.$config.config$,
      me$,
      this.$category.categories$,
      this.$shop.shops$
    ];

    //
    // preload cats
    if (this.preload.categories) {
      this.$category.select().subscribe();
    }

    //
    // preload shops
    if (this.preload.shops) {
      this.$shop.query().subscribe();
    }
    //
    // combineLatest to get array with last item of each when one emits an item
    // Config, User, Category[], Shop[]
    return combineLatest(loaders);
  }

  ready() {
    return this.loader;//.pipe(tap(console.log));
  }

  readyWithStore() {
    return this.loader.pipe(
      filter(loader => {
        try {
          // 0 => cfg,
          // 1 => user
          // 2 => cat || shops
          const cfg = loader[0];
          const shops = loader[3];
          return !!cfg.shared.hub && !!shops;
        } catch (err) {
          return false;
        }
      })
    );
  }

  update(): Observable<{ config?: Config; user?: User; state?: CartState; shop?: Shop }> {
    return merge(
      this.$config.config$.pipe(map(config => ({ config }))),
      this.$user.user$.pipe(map(user => ({ user }))),
      this.$cart.cart$.pipe(map(state => ({ state }))),
      this.$shop.shop$.pipe(map(shop => ({ shop })))
    )
  }

}



//
// activate route only when loader is ready!
@Injectable()
export class LoaderResolve implements Resolve<Promise<any>> {
  constructor(private $loader: LoaderService) { }
  resolve(route: ActivatedRouteSnapshot) {
    return new Promise(resolve =>{
      this.$loader.ready().subscribe((loader) => {
        resolve(loader);
      });
    });
  }
}
