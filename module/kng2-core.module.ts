import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserPipe } from './user.pipe';
import { UserService } from './user.service';


@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    UserPipe
  ],
  providers:[
    UserService
  ],
  exports:[
    UserPipe    
  ]
})
export class Kng2CoreModule { 

}


