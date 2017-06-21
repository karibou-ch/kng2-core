import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { ConfigComponent }  from './config.component';



import { Kng2CoreModule} from '../../module/kng2-core.module';
import { LoginComponent } from './user.login/login.component';
import { HeaderComponent } from './header/header.component';
import { OrderComponent } from './order/order.component';
import { RecoveryComponent } from './user.recovery/recovery.component';
import { DashboardComponent } from './user.dashboard/dashboard.component';

import { AuthGuardService }  from '../../module/auth-guard.service';

const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'config', component: ConfigComponent },
  { path: 'recovery', component: RecoveryComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService]},
  { path: '',
    redirectTo: '/config',
    pathMatch: 'full'
  },
  // { path: '**', component: PageNotFoundComponent }
];


@NgModule({
  declarations: [
    AppComponent,
    ConfigComponent,
    HeaderComponent,
    LoginComponent,
    OrderComponent,
    RecoveryComponent
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
