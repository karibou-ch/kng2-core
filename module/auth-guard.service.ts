import { CanActivate }    from '@angular/router';
import { Injectable } from '@angular/core';
import { LoaderService } from './loader.service'
import { Router } from '@angular/router';
import { User } from './user.service'

@Injectable()
export class AuthGuardService implements CanActivate {

  user:User = new User();

  constructor(
    private loaderSrv: LoaderService,
    private _router: Router
    ) {

  }

  canActivate() {
    this.loaderSrv.ready().subscribe(
      (loader) => {
        Object.assign(this.user, loader[1]);
      });
      if(!this.user.isAuthenticated()) this._router.navigate(['/login']);
      return this.user.isAuthenticated();
  }

}
