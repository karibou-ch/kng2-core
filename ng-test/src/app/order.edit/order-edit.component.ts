import { Component, OnInit, Input } from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import { Observable } from 'rxjs/Rx';
import {Order, OrderService, LoaderService, User, UserService, config} from '../../../../dist';

@Component({
  selector: 'app-order-edit',
  templateUrl: './order-edit.component.html',
  styleUrls: ['./order-edit.component.scss']
})
export class OrderEditComponent implements OnInit {

  constructor(
    private $loader: LoaderService,
    private $order: OrderService,
    private route:ActivatedRoute
  ) { }

  @Input() slug:string;
  currentUser:User;
  isReady:boolean;
  config:any;
  @Input() order:Order;

  ngOnInit() {

    this.$loader.ready().subscribe(ready=>{
      this.isReady=true;
      this.config=ready[0];
      this.currentUser=ready[1];
      //
      // two options for slug initialisation : 1) Input, 2) URL
      if(!this.slug){
        this.slug=this.route.snapshot.params['slug'];
      }

      //
      // TODO manage on Error user feedback!
      //this.$order.findBySlug(this.slug).subscribe(or=>this.order=or)

    });
  }

  /*onSave(){
    // TODO use error feedback for user!
    this.$order.save(this.slug,this.order).subscribe()
  }*/

}
