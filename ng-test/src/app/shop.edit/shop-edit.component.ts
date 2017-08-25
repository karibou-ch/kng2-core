import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import { ActivatedRoute } from '@angular/router';
import { FormsModule }   from '@angular/forms';
import { LoaderService, ShopService, Shop, User, UserService, config } from '../../../../dist';

export class Faq {
    q:string;
    a:string;
    updated:Date;
}

@Component({
  selector: 'app-shop-edit',
  templateUrl: './shop-edit.component.html',
  styleUrls: ['./shop-edit.component.scss']
})
export class ShopEditComponent implements OnInit {

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
  private newInstance:boolean=false;
  private errors:any;

  ngOnInit() {

    this.$loader.ready().subscribe(ready => {
      this.isReady = true;
      this.config = ready[0];
      this.currentUser = ready[1];

      // on category creation there is no slug available
      this.newInstance=this.route.snapshot.data.newInstance;
      if(this.newInstance){
        return;
      }

      // two options for slug initialisation : 1) Input, 2) URL
      if(!this.slug){
        this.slug=this.route.snapshot.params['slug'];
      }

      this.slug = this.route.snapshot.params['slug'];
      this.$shop.get(this.slug)
        .subscribe(res => {
          this.shop = res;
        });
    });

  }

  onSave() {
    // TODO use error feedback for user!
    this.$shop.save(this.shop).subscribe()
    // TODO use error feedback for user!
    if(this.newInstance){
      return this.$shop.create(this.shop).subscribe();
    }
    this.$shop.save(this.shop).subscribe(this.processErrors);
  }

  processErrors(err){
    this.errors=err;
  }

  addFaq() {
    this.shop.faq.push(new Faq());
  }

  delFaq(f:Faq){
    let index: number = this.shop.faq.indexOf(f);
    if (index !== -1) {
        this.shop.faq.splice(index, 1);
    }
  }

}
