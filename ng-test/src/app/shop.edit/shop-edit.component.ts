import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LoaderService, ShopService, Shop, User, UserService, Category, CategoryService, config } from '../../../../dist';

export class Faq {
  q: string;
  a: string;
  updated: Date;
}

@Component({
  selector: 'app-shop-edit',
  templateUrl: './shop-edit.component.html',
  styleUrls: ['./shop-edit.component.scss']
})
export class ShopEditComponent implements OnInit {

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
  private newInstance: boolean = false;
  private errors: any;
  private password: string;
  addressR: boolean;

  ngOnInit() {

    this.$loader.ready().subscribe(ready => {
      this.isReady = true;
      this.config = ready[0];
      this.currentUser = ready[1];

      this.$category.select().subscribe(res => {
        this.catalogs = res.filter(res => res.type == "Catalog");
      });


      // two options for slug initialisation : 1) Input, 2) URL
      if (!this.slug) {
        this.slug = this.route.snapshot.params['slug'];
      }

      this.slug = this.route.snapshot.params['slug'];
      this.$shop.get(this.slug)
        .subscribe(res => {
          this.shop = res;
          this.shop.catalog = new Category(res.catalog);
        });
    });

  }

  onSave() {

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

  addFaq() {
    this.shop.faq.push(new Faq());
  }

  delFaq(f: Faq) {
    let index: number = this.shop.faq.indexOf(f);
    if (index !== -1) {
      this.shop.faq.splice(index, 1);
    }
  }

  onDelete() {
    this.$shop.remove(this.shop, this.password).subscribe(res => console.log(res));
  }

}
