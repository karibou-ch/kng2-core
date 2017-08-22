import { Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { LoaderService, ShopService, Shop } from '../../../../dist';

@Component({
  selector: 'app-shop-edit',
  templateUrl: './shop-edit.component.html',
  styleUrls: ['./shop-edit.component.scss']
})
export class ShopEditComponent implements OnInit {

  private shop: Shop;

  constructor(
    private loaderSrv: LoaderService,
    private _router: Router,
    private route: ActivatedRoute,
    private shopSrv: ShopService
  ) { }

  ngOnInit() {
    console.log(this.route.snapshot.params['url']);
    this.shopSrv.get(this.route.snapshot.params['url'])
    .subscribe(res => {
       console.log(res);
       this.shop = res;
    });
  }
}
