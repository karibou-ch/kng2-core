import { CanActivate }    from '@angular/router';
import { Injectable } from '@angular/core';
import { LoaderService } from './loader.service'
import { Observable } from "rxjs/Rx";
import { Router } from '@angular/router';
import { User, UserService } from './user.service'

@Injectable()
export class AuthGuardService implements CanActivate {


  constructor(
    private loaderSrv: LoaderService,
    private _router: Router,
    private userSrv:UserService
    ) {

  }

  //this prevent user from entering dashboard component when not logged
  //use Observable to prevent error when refreshing the page
  //see issue : https://stackoverflow.com/questions/42677274/angular-2-route-guard-not-working-on-browser-refresh/42678548
  canActivate() {
    return this.userSrv.currentUser.isAuthenticated();
    // return this.loaderSrv.ready()
    //   .take(1)
    //   .map((loader) => {
    //     Object.assign(this.user, loader[1]);
    //     return this.user.isAuthenticated();
    //   })
    //   .do((auth) => {
    //     if(!auth) this._router.navigate(['/login'])
    //   });
  }

}
