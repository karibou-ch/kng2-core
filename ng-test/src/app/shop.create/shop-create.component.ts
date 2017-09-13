import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LoaderService, ShopService, Shop, User, UserService, Category, CategoryService, config } from '../../../../dist';

@Component({
  selector: 'app-shop-create',
  templateUrl: './shop-create.component.html',
  styleUrls: ['./shop-create.component.scss']
})
export class ShopCreateComponent implements OnInit {

  constructor(
    private http: HttpClient,
    private $loader: LoaderService,
    private route: ActivatedRoute,
    private $shop: ShopService,
    private $category: CategoryService,
  ) { }


  @Input() slug: string;
  private currentUser: User;
  private isReady: boolean;
  private config: any;
  private shop: Shop = new Shop();
  private catalogs: Array<Category> = new Array;
  private errors: any;
  addressR: boolean;

  ngOnInit() {

    this.$loader.ready().subscribe(ready => {
      this.isReady = true;
      this.config = ready[0];
      this.currentUser = ready[1];

      //Loading categorys before the if newInstance
      this.$category.select().subscribe(res => {
        this.catalogs = res.filter(res => res.type == "Catalog");
      });

    });

  }

  onCreate() {

    if (this.addressR) {
      this.shop.catalog = this.shop.catalog._id;
      this.$shop.create(this.shop).subscribe();
    } else {
      console.log("Pls add a valide address");
    }
  }

  processErrors(err) {
    this.errors = err;
  }

}
