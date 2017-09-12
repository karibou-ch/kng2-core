import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoaderService, Shop, User, UserService } from '../../../../dist'

@Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.component.html',
    styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

    private user: User = new User();
    private shops: Shop[];

    constructor(
        private $loader: LoaderService,
        private _router: Router,
        private $user: UserService
    ) { }

    ngOnInit() {
        this.$loader.ready().subscribe(
            (loader) => {
                Object.assign(this.user, loader[1]);
            });
        if (!this.user.isAuthenticated()) {
            this._router.navigate(['login']);
        }
        
    }

    createAlarm() {
        //get in ;)
    }

    orderHistoryCheck() {

    }

}
