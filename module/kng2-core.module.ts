import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserPipe } from './user.pipe';
import { UserService } from './user.service';

import { OrderService } from './order/order.service';

import { ConfigService } from './config.service';


@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    UserPipe
  ],
  providers:[
    ConfigService,
    UserService,
    OrderService
  ],
  exports:[
    UserPipe    
  ]
})
export class Kng2CoreModule { 

}


