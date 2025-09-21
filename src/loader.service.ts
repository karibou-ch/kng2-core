import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';

import { Config } from './config';
import { ConfigService } from './config.service';

import { User, UserService } from './user.service';
import { CategoryService, Category } from './category.service';
import { Shop, ShopService } from './shop.service';

import { Observable, merge, combineLatest, throwError as _throw, ReplaySubject, of } from 'rxjs';

import { catchError, flatMap, map, publishReplay, refCount, filter, mergeMap, switchMap, tap, skip, startWith, take } from 'rxjs/operators';
import { CartService, CartState } from './cart.service';
import { OrderService } from './order/order.service';
import { Order } from './order/order';

//
// Types pour LoaderService
export interface LoaderCoreData {
  config?: Config;
  user?: User;
  state?: CartState;
  categories?: Category[];
  shops?: Shop[];
  orders?: Order[];
  // ✅ TIMESTAMP UNIQUE pour cache intelligent
  timestamp?: number;
}

// Tuple pour readyWithStore - seuls config et user sont obligatoires
export type LoaderData = [Config, User, Category[]?, Shop[]?, Order[]?, Error?];


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
  // DEPRECATED
  // private loader: Observable<any>;


  private latestCoreData: LoaderCoreData = {};
  private error: any;
  private preload: {
    categories: boolean;
    shops: boolean;
    orders: number;
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
      shops: (ConfigService.defaultConfig.loader.indexOf('shops') > -1),
      orders: ConfigService.defaultConfig.preloadOrders
    };




    //
    // install config obs
    // DEPRECATED
    // this.config$ = this.$config.get();

    // this.loader = this.config$.pipe(
    //   mergeMap(this.preloader.bind(this)),
    //   //
    //   // transform observable to ConnectableObservable (multicasting)
    //   publishReplay(1),
    //   //
    //   // used to auto-connect to the source when there is >= 1 subscribers
    //   refCount(),
    //   catchError(err => {
    //     this.error = err;
    //     console.log('--- LOAD ERR', err);
    //     return _throw(err);
    //   })
    // );
  }

  getError() {
    return this.error;
  }



  /** @deprecated */
  private preloader(config: Config) {
    const me$ = this.$user.me();

    //
    // preload cats
    if (this.preload.categories) {
      this.$category.categories$ = new ReplaySubject<Category[]>();
      this.$category.select().subscribe();
      // this.$category.select().subscribe(()=>({}),error => {
      //   console.log('--- DBG loader.category (1)',error.error);
      //   console.log('--- DBG loader.category (2)',error);
      // });
    }

    //
    // in case of preload shops, shops$ should block
    if (this.preload.shops) {
      this.$shop.shops$ = new ReplaySubject<Shop[]>();
      this.$shop.query().subscribe();
    }

    //
    // get last orders
    const catchError = true;
    this.$order.findOrdersByUser({id:1},{limit:(this.preload.orders)},catchError).subscribe();
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




  update(): Observable<Partial<LoaderCoreData>> {
    return merge(
      this.$config.config$.pipe(map(config => ({ config }))),
      this.$user.user$.pipe(
        map(user => ({ user }))
      ),
      this.$cart.cart$.pipe(map(state => ({ state }))),
      this.$shop.shops$.pipe(map(shops => ({ shops }))),
      this.$order.orders$.pipe(map(orders => ({ orders }))),
    );
  }

  /**
   * Charge et broadcast config+hub avec tous les services associés
   * @param hubSlug Slug du hub (optionnel = config par défaut)
   * @returns Observable LoaderData [Config, User, Category[]?, Shop[]?, Order[]?]
   */
  readyWithStore(hubSlug?: string): Observable<LoaderData> {

    // === CAS 1: hubSlug null → config par défaut ===
    if (!hubSlug) {
      return this.$config.get().pipe(
        tap(config => {
          // ✅ BROADCAST config par défaut
          this.$config.config$.next(config);
        }),
        switchMap(config => this.loadAllServices(config, null))
      );
    }

    // === CAS 2: hubSlug existe → config hub-spécifique ===
    const store = hubSlug;

    return this.$config.get(store).pipe(
      tap(configWithHub => {
        // ✅ BROADCAST nouvelle config hub
        this.$config.config$.next(configWithHub);
      }),
      switchMap(configWithHub => this.loadAllServices(configWithHub, store, true))
    );
  }

    /**
   * Charge tous les services selon preload settings
   * @param config Configuration chargée
   * @param hubSlug Hub spécifique (null = tous)
   */
  private loadAllServices(config: Config, hubSlug?: string, force=false): Observable<LoaderData> {
    const now = Date.now();
    const CACHE_TTL = 500; // 500ms comme demandé

    // ✅ CACHE INTELLIGENT: Vérifier timestamp unique
    const cacheAge = this.latestCoreData.timestamp ? now - this.latestCoreData.timestamp : Infinity;
    const isCacheValid = cacheAge < CACHE_TTL &&
                        this.latestCoreData.categories &&
                        this.latestCoreData.shops &&
                        this.latestCoreData.orders;

    if (isCacheValid && !force) {
      console.log(`🚀 LoaderService: Using cache (age: ${cacheAge}ms, TTL: ${CACHE_TTL}ms)`);
      return of([
        config,
        this.latestCoreData.user || new User(),
        this.latestCoreData.categories,
        this.latestCoreData.shops,
        this.latestCoreData.orders
      ] as LoaderData);
    }

    console.log(`📊 LoaderService: Fresh load (age: ${cacheAge}ms, force: ${force})`);

    const loaders: Observable<any>[] = [
      of(config), // Config déjà chargée

      // ✅ CORRECTION CRITIQUE: Restaurer user.me() pour authentification au boot
      this.$user.me().pipe(
        tap(user => this.$user.user$.next(user)), // ✅ Broadcast vers user$ pour sync
        catchError(err => {
          // ✅ err.status === 401 = utilisateur anonyme (normal)
          return of(new User()); // Fallback même en cas d'erreur serveur
        })
      ), // User OBLIGATOIRE avec fetch API serveur
    ];

    // ✅ Categories selon hub - FRESH LOAD
    if (this.preload.categories || force) {
      this.$category.select().subscribe(); // Trigger reload
      loaders.push(this.$category.categories$.pipe(
        catchError(err => {
          return of([]); // ✅ Continue avec categories vides
        })
      ));
    } else {
      loaders.push(of([])); // Empty array si pas preload
    }

    // ✅ Shops selon hub - FRESH LOAD
    if (this.preload.shops || force) {
      const query = hubSlug ? {hub: hubSlug} : {};
      this.$shop.query(query).subscribe(); // Trigger reload (hub-specific ou tous)
      loaders.push(this.$shop.shops$.pipe(
        catchError(err => {
          return of([]); // ✅ Continue avec shops vides
        })
      ));
    } else {
      loaders.push(of([])); // Empty array si pas preload
    }

    // ✅ Orders pour ce user - CONDITIONAL LOAD après user.me()
    if (this.preload.orders || force) {
      loaders.push(
        // ✅ CORRECTION CRITIQUE: Charger orders APRÈS user.me() réussi
        loaders[1].pipe( // loaders[1] = user.me() observable
          switchMap(user => {
            if (user && user.isAuthenticated && user.isAuthenticated()) {
              // ✅ User authentifié: charger ses orders
              this.$order.findOrdersByUser({id: 1}, {limit: this.preload.orders}).subscribe();
              return this.$order.orders$.pipe(
                catchError(err => of([])) // Fallback orders vides
              );
            } else {
              // ✅ User anonyme: pas d'orders
              return of([]);
            }
          }),
          catchError(err => of([])) // Fallback général
        )
      );
    } else {
      loaders.push(of([])); // Empty array si pas preload
    }

    return combineLatest(loaders).pipe(
      tap(([config, user, categories, shops, orders]) => {
        // ✅ BROADCAST automatique si services émettent des updates
        this.setupLatestCoreData(config, user, categories, shops, orders);
      }),
      catchError(err => {
        // Fallback en cas d'erreur critique (ne devrait pas arriver)
        return of([config, new User(), [], [], [], err] as LoaderData);
      })
    ) as Observable<LoaderData>;
  }

  /**
   * Configure le broadcasting automatique lors des updates de services
   */
  private setupLatestCoreData(config: Config, user: User, categories: Category[], shops: Shop[], orders: Order[]) {
    this.latestCoreData = {
      config,
      user,
      categories,
      shops,
      orders,
      // ✅ TIMESTAMP UNIQUE pour cache intelligent
      timestamp: Date.now()
    };
  }

  /**
   * Parse route snapshot data loader pour extraire config, user, categories, shops, orders
   * @param snapshotData - Données de route.snapshot.data.loader (format LoaderData)
   * @returns LoaderCoreData avec config, user, categories, shops, orders typés
   *
   * @example
   * ```typescript
   * // Dans un composant utilisant route data
   * ngOnInit() {
   *   const { config, user, categories, shops, orders } =
   *     LoaderService.parseSnapshotData(this.$route.snapshot.data.loader);
   *
   *   if (config && user) {
   *     this.initializeWithData(config, user);
   *   }
   * }
   * ```
   */
  static parseSnapshotData(snapshotData: any): LoaderCoreData {
    // ✅ VALIDATION: Vérifier que snapshotData est un array de type LoaderData
    if (!snapshotData || !Array.isArray(snapshotData)) {
      console.warn('LoaderService.parseSnapshotData: snapshotData invalide ou manquant', snapshotData);
      return {
        config: null,
        user: null,
        state: null,
        categories: null,
        shops: null,
        orders: null
      };
    }

    // ✅ EXTRACTION: Selon format LoaderData = [Config, User, Category[]?, Shop[]?, Order[]?]
    const [config, user, categories, shops, orders] = snapshotData as LoaderData;

    // ✅ VALIDATION: Config et User sont obligatoires
    if (!config || !user) {
      console.warn('LoaderService.parseSnapshotData: config ou user manquant', {
        config: !!config,
        user: !!user
      });
    }

    // ✅ RETOUR: Objet typé avec toutes les données extraites
    return {
      config: config || null,
      user: user || null,
      state: null, // parseSnapshotData ne contient pas le state du cart
      categories: categories || null,
      shops: shops || null,
      orders: orders || null,
      timestamp: Date.now() // ✅ TIMESTAMP pour cache
    };
  }

  /**
   * ✅ TEMPS RÉEL: Récupère les dernières valeurs des Subject
   *
   * @returns LoaderCoreData avec toutes les données core actuelles
   */
  getLatestCoreData(): LoaderCoreData {
    return Object.assign({}, this.latestCoreData);
  }

}



//
// activate route only when loader is ready!
@Injectable()
export class LoaderResolve implements Resolve<Promise<any>> {
  constructor(private $loader: LoaderService) { }
  resolve(route: ActivatedRouteSnapshot) {
    return new Promise(resolve => {
      this.$loader.readyWithStore().subscribe((loader) => {
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
      this.$loader.readyWithStore().subscribe(([config, user]) => {
        resolve([config, user]);
      });
    });
  }
}
