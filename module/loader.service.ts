import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from "rxjs/Rx";
import { Observable } from 'rxjs/Observable';
import { ConnectableObservable } from 'rxjs/observable/ConnectableObservable'
import 'rxjs/Rx';

import { Config } from './config';
import { User } from './user.service';
import { Category } from './category.service';

import { ConfigService } from './config.service';
import { UserService } from './user.service';
import { CategoryService } from './category.service'

@Injectable()
export class LoaderService {

  // a BehaviorSubject can cache the last emited value so clients subscribing later can access the previously emitted data
  //private loader: BehaviorSubject<[Config, User]> = new BehaviorSubject<[Config, User]>([null,null]);
  private loader: Observable<[Config, User]>;

  constructor(
    private http: Http,
    private configSrv: ConfigService,
    private userSrv: UserService,
    private categorySrv: CategoryService
  ) {

    //create a multicast Observable with cachine property of BehaviorSubject (publishbehavior)
    //every subscribing component will be connected to the same request and get the last item recieved
    this.loader = this.configSrv.getConfig()
      .flatMap(config =>
        //combineLatest to get array with last item of each when one emits an item
        Observable.combineLatest(
          Observable.of(config),
          this.userSrv.me()
        )
      )
      .publishBehavior(null)  // transform observable to ConnectableObservable (multicasting)
      .refCount();            // used to auto-connect to the source when there is >= 1 subscribers
  }


  ready() {
    return this.loader;
  }

}
