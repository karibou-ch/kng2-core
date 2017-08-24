import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { LoaderService, Order, OrderService, User, UserService, SerializationService } from '../../../../dist';

@Component({
  selector: 'app-user-orders',
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit {

  constructor(
    private $loader: LoaderService,
    private $order: OrderService,
    private $user: UserService,
    private $serialization: SerializationService
  ) { }

  isReady: boolean = false;
  date;
  currentUser: User;
  config: any;
  next: Date;
  current: Date;
  orders: Order[];

  ngOnInit() {
    this.$loader.ready().subscribe(ready => {
      this.isReady = true;
      this.config = ready[0];
      this.currentUser = ready[1];

      this.$order.findOrdersByUser(this.currentUser).subscribe(orders => this.castOrdersIntoArray(orders));
    })

  }

  castOrdersIntoArray(objs: Object[]){
    this.orders = new Array<Order>();
    for( let o of objs){
      var json = JSON.stringify(o);
      this.orders.push(this.$serialization.toInstance(new Order(), json));
    }
    console.log(this.orders);
    console.log(this.orders[0].closed);
  }

  /*getSubTotal(order:Object){
    var json = JSON.stringify(order),
    o:Order = this.$serialization.toInstance(new Order(), json);
    return  o.getSubTotal();
  }*/

}
