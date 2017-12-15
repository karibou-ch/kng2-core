import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';
import { LoaderService, ShopService, Shop, User, UserService, config } from '../../../../dist/';

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


  @Input() slug:string;
  private currentUser: User;
  private isReady: boolean;
  private config: any;
  private shop: Shop = new Shop();

  ngOnInit() {

    this.$loader.ready().subscribe(ready => {
      this.isReady=true;
      this.config=ready[0];
      this.currentUser=ready[1];
      //
      // two options for slug initialisation : 1) Input, 2) URL
      if(!this.slug){
        this.slug=this.route.snapshot.params['slug'];
      }
      this.isReady = true;
      this.config = ready[0];
      this.currentUser = <User> ready[1];
      this.$shop.get(this.slug)
        .subscribe(res => {
          this.shop = res;
        });
    });
  }
}
