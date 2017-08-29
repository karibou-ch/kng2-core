import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService, Kng2CoreModule } from '../../../dist';

import { ConfigComponent } from './config/config.component';
import { CategoryComponent } from './category/category.component';
import { CategoryEditComponent } from './category.edit/category-edit.component';
import { DashboardComponent } from './user.dashboard/dashboard.component';
import { HeaderComponent } from './header/header.component';
import { LoginComponent } from './user.login/login.component';
import { RegisterComponent } from './user.register/register.component';
import { UsersComponent } from './users/users.component';
import { OrderComponent } from './order/order.component';
import { ShopComponent } from './shop/shop.component';
import { RecoveryComponent } from './user.recovery/recovery.component';


export const appRoutes: Routes = [
  { path: 'config', component: ConfigComponent },
  { path: 'category', component: CategoryComponent },
  { path: 'category/create', component: CategoryEditComponent, data: { newInstance: true } },
  { path: 'category/:slug', component: CategoryEditComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'order', component: OrderComponent },
  { path: 'users', component: UsersComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'recovery', component: RecoveryComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService] },
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full'
  },
  // { path: '**', component: PageNotFoundComponent }
];
