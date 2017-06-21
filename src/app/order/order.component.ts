import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { Order }  from '../../../module/order/order'
import { OrderService } from '../../../module/order/order.service'

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {


  constructor(
    Observable
  ) { }

  ngOnInit() {
  }

}
