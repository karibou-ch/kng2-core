import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { appRoutes } from './app.routes';

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
import { ProductComponent, ProductThumbnailComponent, ProductTinyComponent } from './product/product.component';
import { ProductEditComponent } from './product.edit/product-edit.component';
import { ProductCreateComponent } from './product.create/product-create.component';
import { HomeComponent } from './home/home.component';

import { Kng2CoreModule } from '../../../dist/';

const kng2Config={
  API_SERVER:'http://api.karibou.evaletolab.ch',
  loader:[
    "categories",
    "shops"
  ]
};

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
    ProductThumbnailComponent,
    ProductTinyComponent,
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
    ShopListComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    HttpClientModule,
    Kng2CoreModule.forRoot(kng2Config),
    RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

