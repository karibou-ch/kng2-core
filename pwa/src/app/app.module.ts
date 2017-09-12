import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { LoginComponent } from './user.login/login.component';
import { UserProfileComponent } from './user.profile/user-profile.component';
import { RegisterComponent } from './user.register/register.component';

import { AuthGuardService, Kng2CoreModule } from '../../../dist';

import { appRoutes } from './app.routes';

import {MdButtonModule, MdCheckboxModule, MdSidenavModule, MdMenuModule, MdTabsModule,
        MdToolbarModule, MdIconModule, MdCardModule, MdInputModule, MdExpansionModule} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    UserProfileComponent,
    RegisterComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    Kng2CoreModule,
    HttpClientModule,
    MdButtonModule, MdCheckboxModule, MdSidenavModule, MdMenuModule, MdTabsModule,
    MdToolbarModule ,MdIconModule, MdCardModule, MdInputModule, MdExpansionModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(appRoutes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
