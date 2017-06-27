import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';


import { AuthGuardService } from './auth-guard.service';

import { Category, CategoryService } from './category.service';
import { ConfigService } from './config.service';
import { LoaderService } from './loader.service';
import { OrderService } from './order/order.service';
import { Order }  from './order/order';
import { UserPipe } from './user.pipe';
import { User, Shop, UserService } from './user.service';


@NgModule({
  imports: [
    CommonModule,
    HttpModule
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

//
//
export {
  AuthGuardService,
  CategoryService,Category,
  ConfigService,
  LoaderService,
  OrderService, Order,
  UserPipe,
  UserService, User, Shop
}

export * from './order/order.enum';
export { Config } from './config';