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
  results:Observable<any>;
  date;

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

  collectOf(){
    let date = new Date(this.date);
    let month = date.getMonth();
    this.results = this.orderSrv.findAllOrders({groupby:'shop', month:month+1});
  }

  findAllOrdersForShipping(){
    let date = new Date(this.date);
    let month = date.getMonth();
    this.results = this.orderSrv.findAllOrders({fulfillments:'fulfilled,partial', month:month+1});
  }

}
