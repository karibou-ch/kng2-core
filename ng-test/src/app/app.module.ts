import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { ConfigComponent }  from './config/config.component';

import { LoginComponent } from './user.login/login.component';
import { HeaderComponent } from './header/header.component';
import { OrderComponent } from './order/order.component';
import { RecoveryComponent } from './user.recovery/recovery.component';
import { DashboardComponent } from './user.dashboard/dashboard.component';
import { ShopComponent } from './shop/shop.component';
import { ShopListComponent } from './shop.list/shop-list.component';

import { AuthGuardService, Kng2CoreModule }  from '../../../dist';

import { appRoutes } from './app.routes';


@NgModule({
  declarations: [
    AppComponent,
    ConfigComponent,
    HeaderComponent,
    LoginComponent,
    OrderComponent,
    RecoveryComponent,
    DashboardComponent,
    ShopComponent,
    ShopListComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    Kng2CoreModule,
    HttpModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
