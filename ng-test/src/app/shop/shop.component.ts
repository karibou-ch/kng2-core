import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoaderService, Shop } from '../../../../dist'

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {

  shops: Shop[] = null;

  constructor(
    private loaderSrv: LoaderService,
    private _router: Router,
    //private shopSrv: ShopService
  ) { }

  ngOnInit() {
     this.loaderSrv.ready().subscribe(
       (loader) => {
         //Object.assign(this.shop, loader[1]);
       })
  }

}
