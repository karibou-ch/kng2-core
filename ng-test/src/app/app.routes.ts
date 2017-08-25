import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService, Kng2CoreModule }  from '../../../dist';

import { ConfigComponent }  from './config/config.component';
import { CategoryComponent }  from './category/category.component';
import { ProductListComponent }  from './product.list/product-list.component';
import { ProductEditComponent }  from './product.edit/product-edit.component';
import { ProductComponent }  from './product/product.component';
import { CategoryEditComponent }  from './category.edit/category-edit.component';
import { DashboardComponent } from './user.dashboard/dashboard.component';
import { HeaderComponent } from './header/header.component';
import { LoginComponent } from './user.login/login.component';
import { OrderComponent } from './order/order.component';
import { RecoveryComponent } from './user.recovery/recovery.component';


export const appRoutes: Routes = [
  { path: 'config', component: ConfigComponent },
  { path: 'category', component: CategoryComponent },
  { path: 'product', component: ProductListComponent },
  { path: 'product/:sku', component: ProductComponent },
  { path: 'product/edit/:sku', component: ProductEditComponent },
  { path: 'category/:slug', component: CategoryEditComponent },
  { path: 'login', component: LoginComponent },
  { path: 'order', component: OrderComponent },
  { path: 'recovery', component: RecoveryComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService]},
  { path: '',
    redirectTo: '/',
    pathMatch: 'full'
  },
  // { path: '**', component: PageNotFoundComponent }
];


