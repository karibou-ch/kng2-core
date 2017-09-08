import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService, Kng2CoreModule } from '../../../dist';

import { LoginComponent } from './user.login/login.component';


export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full'
  },
  // { path: '**', component: PageNotFoundComponent }
];
