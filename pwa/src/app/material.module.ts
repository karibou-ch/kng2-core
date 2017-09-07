import { NgModule } from '@angular/core';

import {
  MdButtonModule,
  MdMenuModule,
  MdToolbarModule,
  MdIconModule,
  MdCardModule
} from '@angular/material';

@NgModule({
  imports: [
    MdButtonModule,
    MdMenuModule,
    MdToolbarModule,
    MdIconModule,
    MdCardModule
  ],
  exports: [
    MdButtonModule,
    MdMenuModule,
    MdToolbarModule,
    MdIconModule,
    MdCardModule
  ]
})
export class MaterialModule {}
