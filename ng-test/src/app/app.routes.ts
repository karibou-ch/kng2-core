import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService, Kng2CoreModule } from '../../../';

import { ConfigComponent }  from './config/config.component';
import { ProductListComponent }  from './product.list/product-list.component';
import { ProductEditComponent }  from './product.edit/product-edit.component';
import { ProductCreateComponent } from './product.create/product-create.component';
import { ProductComponent }  from './product/product.component';
import { CategoryComponent } from './category/category.component';
import { CategoryEditComponent } from './category.edit/category-edit.component';
import { DashboardComponent } from './user.dashboard/dashboard.component';
import { HeaderComponent } from './header/header.component';
import { LoginComponent } from './user.login/login.component';
import { RegisterComponent } from './user.register/register.component';
import { UserComponent } from './user/user.component';
import { UserPasswordComponent } from './user.password/user-password.component';
import { UserListComponent } from './user.list/user-list.component';
import { OrderComponent } from './order/order.component';
import { ShopComponent } from './shop/shop.component';
import { ShopListComponent } from './shop.list/shop-list.component';
import { ShopEditComponent } from './shop.edit/shop-edit.component';
import { ShopCreateComponent } from './shop.create/shop-create.component';
import { RecoveryComponent } from './user.recovery/recovery.component';

export const appRoutes: Routes = [
  { path: 'config', component: ConfigComponent },
  { path: 'category', component: CategoryComponent },
  { path: 'product', component: ProductListComponent },
  { path: 'product/create', component: ProductCreateComponent },
  { path: 'product/:sku', component: ProductComponent },
  { path: 'product/edit/:sku', component: ProductEditComponent },
  { path: 'category/create', component: CategoryEditComponent, data:{newInstance:true} },
  { path: 'category/:slug', component: CategoryEditComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'order', component: OrderComponent },
  { path: 'user/:id', component: UserComponent },
  { path: 'user/password/:id', component: UserComponent },
  { path: 'users', component: UserListComponent },
  { path: 'shop/edit/:slug', component: ShopEditComponent },
  { path: 'shop/create', component: ShopCreateComponent},
  { path: 'shop/:slug', component: ShopComponent },
  { path: 'shop', component: ShopListComponent },
  { path: 'recovery', component: RecoveryComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService] },
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full'
  },
  // { path: '**', component: PageNotFoundComponent }
];
