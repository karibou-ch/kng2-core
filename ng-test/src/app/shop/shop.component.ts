import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { ActivatedRoute } from '@angular/router';
import { LoaderService, ShopService, Shop, User, UserService, config } from '../../../../dist';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {

  constructor(
    private $loader: LoaderService,
    private route: ActivatedRoute,
    private $shop: ShopService
  ) { }

  private currentUser: User;
  private isReady: boolean;
  private config: any;
  private shop: Shop;
  private slug: string;

  ngOnInit() {

    this.$loader.ready().subscribe(ready => {
      this.isReady = true;
      this.config = ready[0];
      this.currentUser = ready[1];
      this.slug = this.route.snapshot.params['slug'];
      this.$shop.get(this.slug)
        .subscribe(res => {
          this.shop = res;
        });

    });
  }
}
