import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { LoaderService, Order, OrderService, User, UserService } from '../../../../dist';

@Component({
  selector: 'app-user-orders',
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.scss']
})
export class UserOrdersComponent implements OnInit {

  constructor(
    private $loader: LoaderService,
    private $order: OrderService,
    private $user: UserService
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

      this.$order.findOrdersByUser(this.currentUser).subscribe(orders => this.orders = orders);
    })

  }

}
