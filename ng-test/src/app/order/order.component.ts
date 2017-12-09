import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { LoaderService, Order, OrderService, User, UserService }  from '../../../../dist/'

@Component({
  selector: 'order-app',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {

  isReady:boolean = false;
  results
  date;
  next:Date;
  current:Date;
  // user:User;
  // users:User[];

  constructor(
    private loaderSrv: LoaderService,
    private orderSrv: OrderService,
    private userSrv: UserService
  ) { }

  ngOnInit() {
    this.loaderSrv.ready().subscribe((loader) => {
      this.isReady=true;
      this.next=Order.nextShippingDay();
      this.current=Order.currentShippingDay();

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
  /*
  findOrdersByUser(){
    let user = this.user;
    this.results = this.orderSrv.findOrdersByUser(user);
  }
  */

}
