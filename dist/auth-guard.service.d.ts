import { CanActivate } from '@angular/router';
import { LoaderService } from './loader.service';
import { Router } from '@angular/router';
import { UserService } from './user.service';
export declare class AuthGuardService implements CanActivate {
    private loaderSrv;
    private _router;
    private userSrv;
    constructor(loaderSrv: LoaderService, _router: Router, userSrv: UserService);
    canActivate(): boolean;
}
