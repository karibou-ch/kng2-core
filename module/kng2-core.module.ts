import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthGuardService }  from './auth-guard.service';
import { UserPipe } from './user.pipe';
import { UserService } from './user.service';
import { ConfigService }  from './config.service';
import { LoaderService }  from './loader.service';
import {CategoryService } from './category.service'

<<<<<<< HEAD
import { OrderService } from './order/order.service';

import { ConfigService } from './config.service';

=======
/*export function loaderServiceFactory(loader: LoaderService): Function {
    return () => loader.load();
}*/
>>>>>>> master

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    UserPipe
  ],
  providers:[
<<<<<<< HEAD
    ConfigService,
    UserService,
    OrderService
=======
    LoaderService,
    UserService,
    ConfigService,
    CategoryService,
    AuthGuardService
>>>>>>> master
  ],
  exports:[
    UserPipe  
  ]
})
export class Kng2CoreModule { 

}


