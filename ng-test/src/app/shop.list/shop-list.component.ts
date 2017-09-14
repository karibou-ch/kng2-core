import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { LoaderService, ShopService, Shop, User, UserService, config } from '../../../../';

@Component({
  selector: 'app-shop-list',
  templateUrl: './shop-list.component.html',
  styleUrls: ['./shop-list.component.scss']
})
export class ShopListComponent implements OnInit {



  constructor(
    private $loader: LoaderService,
    private route: ActivatedRoute,
    private router: Router,
    private $shop: ShopService
  ) { }

  private currentUser: User;
  private isReady: boolean;
  private config: any;
  private shops: Shop[];

  ngOnInit() {
    this.$loader.ready().subscribe(ready => {
      this.isReady = true;
      this.config = ready[0];
      this.currentUser = ready[1];

      this.$shop.query("")
        .subscribe(res => {
          this.shops = res;
        });

    });
  }

  onNewShop(route){
    this.router.navigate(route);
  }
}
