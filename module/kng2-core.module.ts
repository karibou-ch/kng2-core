import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthGuardService } from './auth-guard.service';

import { CategoryService } from './category.service';
import { ConfigService } from './config.service';
import { LoaderService } from './loader.service';
import { OrderService } from './order/order.service';
import { UserPipe } from './user.pipe';
import { UserService } from './user.service';



@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    UserPipe
  ],
  providers: [
    AuthGuardService,
    CategoryService,
    ConfigService,
    LoaderService,
    OrderService,
    UserService
  ],
  exports: [
    UserPipe
  ]
})
export class Kng2CoreModule {

}


