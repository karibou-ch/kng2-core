import { EventEmitter, Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from "rxjs/Rx";
import { Observable } from 'rxjs/Observable';
import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable'
import 'rxjs/Rx';

import { Config } from './config';
import { User, UserCard, UserAddress } from './user.service';
import { Category } from './category.service';
import { Product } from './product.service';

import { ConfigService } from './config.service';
import { UserService } from './user.service';
import { CategoryService } from './category.service';
import { ProductService } from './product.service'

//manage the first requests needed when bootstrapping the application. Used by the components.
@Injectable()
export class LoaderService {

  // a BehaviorSubject can cache the last emited value so clients subscribing later can access the previously emitted data
  //private loader: BehaviorSubject<[Config, User]> = new BehaviorSubject<[Config, User]>([null,null]);
  private loader: Observable<[Config, User]>;

  constructor(
    private http: Http,
    private config: ConfigService,
    private user: UserService,
    private productSrv: ProductService,
    private categorySrv: CategoryService
  ) {

    //
    //create a multicast Observable with the caching property of BehaviorSubject (publishbehavior)
    //every subscribing component will be connected to the same request and get the last item received


    this.loader = this.config.init()
      .flatMap(config =>
        //
        //combineLatest to get array with last item of each when one emits an item
        Observable.combineLatest(
          Observable.of(config),
          this.user.me()
        )
      )
      //
      // transform observable to ConnectableObservable (multicasting)
      .publishReplay(1)
      //
      // used to auto-connect to the source when there is >= 1 subscribers
      .refCount();
  }


  ready() {
    return this.loader;
  }

}
