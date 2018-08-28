import { Injectable } from '@angular/core';
import { LoaderService } from './loader.service'
import { Observable } from "rxjs";
import { User, UserService } from './user.service'

@Injectable()
export class IsAuthenticated {
  constructor(
    private $user:UserService
    ) {}

  //this prevent user from entering dashboard component when not logged
  //use Observable to prevent error when refreshing the page
  //see issue : https://stackoverflow.com/questions/42677274/angular-2-route-guard-not-working-on-browser-refresh/42678548
  canActivate() {
    return this.$user.currentUser.isAuthenticated();
  }
}


@Injectable()
export class IsAdmin {
  constructor(
    private $user:UserService
    ) {}

  canActivate() {
    return this.$user.currentUser.isAdmin();
  }
}

// https://angular.io/api/router/CanActivate
// @Injectable()
// class CanActivateTeam implements CanActivate {
//   constructor(private permissions: Permissions, private currentUser: UserToken) {}

//   canActivate(
//     route: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot
//   ): Observable<boolean>|Promise<boolean>|boolean {
//     return this.permissions.canActivate(this.currentUser, route.params.id);
//   }
// }
