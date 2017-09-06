import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { ConfigComponent } from './config/config.component';

import { LoginComponent } from './user.login/login.component';
import { HeaderComponent } from './header/header.component';
import { OrderComponent } from './order/order.component';
import { RecoveryComponent } from './user.recovery/recovery.component';
import { DashboardComponent } from './user.dashboard/dashboard.component';

import { ShopComponent } from './shop/shop.component';
import { ShopListComponent } from './shop.list/shop-list.component';
import { ShopEditComponent } from './shop.edit/shop-edit.component';

import { AuthGuardService, Kng2CoreModule } from '../../../dist';

import { appRoutes } from './app.routes';
import { AddressComponent } from './user.address/address.component';
import { CardComponent } from './user.card/card.component';
import { CategoryComponent } from './category/category.component';
import { CategoryEditComponent } from './category.edit/category-edit.component';
import { UserOrdersComponent } from './user.orders/user-orders.component';
import { ShopCreateComponent } from './shop.create/shop-create.component';

@NgModule({
  declarations: [
    AppComponent,
    ConfigComponent,
    HeaderComponent,
    LoginComponent,
    OrderComponent,
    RecoveryComponent,
    DashboardComponent,
    AddressComponent,
    CardComponent,
    ShopComponent,
    CategoryComponent,
    CategoryEditComponent,
    UserOrdersComponent,
    ShopComponent,
    ShopListComponent,
    ShopEditComponent,
    ShopCreateComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    Kng2CoreModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
