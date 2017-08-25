import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService, Kng2CoreModule }  from '../../../dist';

import { ConfigComponent }  from './config/config.component';
import { CategoryComponent }  from './category/category.component';
import { CategoryEditComponent }  from './category.edit/category-edit.component';
import { DashboardComponent } from './user.dashboard/dashboard.component';
import { HeaderComponent } from './header/header.component';
import { LoginComponent } from './user.login/login.component';
import { OrderComponent } from './order/order.component';
import { ShopComponent } from './shop/shop.component';
import { ShopListComponent } from './shop.list/shop-list.component';
import { ShopEditComponent } from './shop.edit/shop-edit.component';
import { RecoveryComponent } from './user.recovery/recovery.component';

export const appRoutes: Routes = [
  { path: 'config', component: ConfigComponent },
  { path: 'category', component: CategoryComponent },
  { path: 'category/create', component: CategoryEditComponent, data:{newInstance:true} },
  { path: 'category/:slug', component: CategoryEditComponent },
  { path: 'login', component: LoginComponent },
  { path: 'order', component: OrderComponent },
  { path: 'shop/edit/:slug', component: ShopEditComponent },
  { path: 'shop/create', component: ShopEditComponent, data:{newInstance:true} },
  { path: 'shop/:slug', component: ShopComponent },
  { path: 'shop', component: ShopListComponent },
  { path: 'recovery', component: RecoveryComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService]},
  { path: '',
    redirectTo: '/',
    pathMatch: 'full'
  },
  // { path: '**', component: PageNotFoundComponent }
];
