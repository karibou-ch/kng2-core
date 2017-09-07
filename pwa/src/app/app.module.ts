import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';

import { AuthGuardService, Kng2CoreModule } from '../../../dist';

import { appRoutes } from './app.routes';

import { MaterialModule } from './material.module';

@NgModule({
  declarations: [
    AppComponent,
    MaterialModule
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
