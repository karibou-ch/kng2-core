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
import { ShopCreateComponent } from './shop.create/shop-create.component';

import { AuthGuardService, Kng2CoreModule } from '../../../';

import { appRoutes } from './app.routes';
import { AddressComponent } from './user.address/address.component';
import { CardComponent } from './user.card/card.component';
import { CategoryComponent } from './category/category.component';
import { CategoryEditComponent } from './category.edit/category-edit.component';
import { RegisterComponent } from './user.register/register.component';

import { UserListComponent } from './user.list/user-list.component';
import { UserComponent } from './user/user.component';
import { UserPasswordComponent } from './user.password/user-password.component';
import { UserOrdersComponent } from './user.orders/user-orders.component';

import { ProductListComponent } from './product.list/product-list.component';
import { ProductComponent } from './product/product.component';
import { ProductEditComponent } from './product.edit/product-edit.component';
import { ProductCreateComponent } from './product.create/product-create.component';

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
    CategoryComponent,
    CategoryEditComponent,
    ProductListComponent,
    ProductComponent,
    ProductEditComponent,
    ProductCreateComponent,
    UserOrdersComponent,
    RegisterComponent,
    UserListComponent,
    UserComponent,
    UserPasswordComponent,
    ShopComponent,
    ShopEditComponent,
    ShopCreateComponent,
    ShopListComponent
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
