import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService, Kng2CoreModule } from '../../../dist';

import { LoginComponent } from './user.login/login.component';
import { RegisterComponent } from './user.register/register.component';


export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full'
  },
  // { path: '**', component: PageNotFoundComponent }
];
