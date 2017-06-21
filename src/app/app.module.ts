import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { ConfigComponent }  from './config.component';
import { Kng2CoreModule } from '../../module/kng2-core.module';
import { OrderComponent } from './order/order.component';

@NgModule({
  declarations: [
    AppComponent,
    ConfigComponent,
    OrderComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    Kng2CoreModule,
    HttpModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
