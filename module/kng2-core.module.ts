import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserPipe } from './user.pipe';
import { UserService } from './user.service';
import { ConfigService }  from './config.service';
import { LoaderService }  from './loader.service';
import {CategoryService } from './category.service'

/*export function loaderServiceFactory(loader: LoaderService): Function {
    return () => loader.load();
}*/

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    UserPipe
  ],
  providers:[
    LoaderService,
    UserService,
    ConfigService,
    CategoryService
  ],
  exports:[
    UserPipe    
  ]
})
export class Kng2CoreModule { 

}


