import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { LoginComponent } from './user.login/login.component';
import { RegisterComponent } from './user.register/register.component';

import { ShopComponent } from './shop/shop.component';

import { AuthGuardService, Kng2CoreModule } from '../../../dist';

import { appRoutes } from './app.routes';

import {MdButtonModule, MdCheckboxModule, MdSidenavModule, MdMenuModule, MdTabsModule, MdChipsModule,
        MdToolbarModule, MdIconModule, MdCardModule, MdInputModule, MdGridListModule, MdExpansionModule} from '@angular/material';
import { FlexLayoutModule } from "@angular/flex-layout";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ShopComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    Kng2CoreModule,
    HttpClientModule,
    MdButtonModule, MdCheckboxModule, MdSidenavModule, MdMenuModule, MdTabsModule, MdChipsModule,
    MdToolbarModule ,MdIconModule, MdCardModule, MdInputModule, MdGridListModule, MdExpansionModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(appRoutes),
    FlexLayoutModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
