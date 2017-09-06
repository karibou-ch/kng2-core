import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { Router } from '@angular/router';
import { LoaderService, User, UserService, Shop, ShopService } from '../../../../dist'

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  constructor(
    private $loader: LoaderService,
    private _router: Router,
    private $user: UserService
  ) { }

  private currentUser: User;
  private isReady: boolean;
  private config: any;
  private users: Array<User> = new Array();

  ngOnInit() {

    this.$loader.ready().subscribe(ready => {
      this.isReady = true;
      this.config = ready[0];
      this.currentUser = ready[1];
      this.$user.query()
        .subscribe(res => {
          this.users = res;
        });
    });
  }

}
