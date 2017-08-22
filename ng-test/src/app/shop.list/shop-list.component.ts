import { Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { LoaderService, ShopService, Shop } from '../../../../dist';

@Component({
  selector: 'app-shop-list',
  templateUrl: './shop-list.component.html',
  styleUrls: ['./shop-list.component.scss']
})
export class ShopListComponent implements OnInit {

  private shops: Shop[];

  constructor(
    private loaderSrv: LoaderService,
    private _router: Router,
    private route: ActivatedRoute,
    private shopSrv: ShopService
  ) { }

  ngOnInit() {
    this.shopSrv.query("")
    .subscribe(res => {
       this.shops = res;
       console.log(res);
    });
  }
}
