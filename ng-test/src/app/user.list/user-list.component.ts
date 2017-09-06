import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoaderService, User, UserService, Shop, ShopService } from '../../../../dist'

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  users: Array<User> = new Array();

  constructor(
    private $loader: LoaderService,
    private _router: Router,
    private $user: UserService,
    private $shop: ShopService
  ) { }

  private currentUser: User;
  private shops: Array<Shop> = [];
  private isReady: boolean;
  private config: any;

  ngOnInit() {

    this.$loader.ready().subscribe(ready => {
      this.isReady = true;
      this.config = ready[0];
      this.currentUser = ready[1];

      this.$user.query().subscribe(res => this.users = res);
      this.$shop.query().subscribe(shops => this.shops = shops);
    });
  }

  nbrOfShop(u: any) {
    if (!this.shops) {
      return this.shops.filter(value => value.owner.id === u).length;
    }
  }

}
