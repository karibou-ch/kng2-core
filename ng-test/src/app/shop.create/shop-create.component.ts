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

    this.shop.catalog = this.shop.catalog._id;
    if (!this.shop.address.region)
      this.shop.address.region = "Suisse";
    var fulladdress = this.shop.address.streetAdress + "," + this.shop.address.postalCode + ", " + this.shop.address.region;
    var url = "//maps.googleapis.com/maps/api/geocode/json?address=" + fulladdress + "&sensor=false";
    this.http.get(url, { withCredentials: false }).subscribe((res: any) => {
      this.shop.address.geo.lat = res.results[0].geometry.location.lat;
      this.shop.address.geo.lng = res.results[0].geometry.location.lng;
      this.$shop.create(this.shop).subscribe();
    });
  }

  processErrors(err) {
    this.errors = err;
  }

}