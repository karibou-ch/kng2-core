import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { LoaderService }  from '../../../module/loader.service'
import { Observable } from 'rxjs/Rx';
import { Order }  from '../../../module/order/order'
import { OrderService } from '../../../module/order/order.service'

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {

  isReady:boolean = false;
  result:Observable<any>;

  constructor(
    private loaderSrv: LoaderService,
    private orderSrv: OrderService
  ) { }

  ngOnInit() {
    this.loaderSrv.ready().subscribe((loader) => {
      //console.log('user object', loader[1]);
      this.isReady=true;
    })
  }

  findAllOrders(){
    this.result = this.orderSrv.findAllOrders(null);
  }

}
