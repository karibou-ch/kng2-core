import { NgModule, ModuleWithProviders, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { IsAuthenticated } from './is-authenticated.service';

import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { ConfigService } from './config.service';
import { LoaderService } from './loader.service';
import { OrderService } from './order/order.service';
import { UserService } from './user.service';
import { ShopService } from './shop.service';

import { Config } from './config';


//
// directives & pipes
import { bgSrcDirective } from './util.bg-src.directive';
import { ConfirmDeleteDirective } from './util.confirm-delete.directive';
import { OrderPortionPipe, OrderBasepricePipe } from './order/order.pipe.portion';
import { MarkdownDirective } from './util.markdown.directive';

//
// dynamic injection of module configuration
const KNG2_OPTIONS = new InjectionToken<any>('app.config');


@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  declarations: [
    bgSrcDirective, 
    ConfirmDeleteDirective, 
    MarkdownDirective,
    OrderPortionPipe, 
    OrderBasepricePipe
  ],
  exports: [
    bgSrcDirective, 
    ConfirmDeleteDirective, 
    MarkdownDirective,
    OrderPortionPipe, 
    OrderBasepricePipe
  ]
})




export class Kng2CoreModule {
  // in root module : import Kng2CoreModule.forRoot() to have only one instance of services when lazy loaded
  //https://angular-2-training-book.rangle.io/handout/modules/feature-modules.html
  public static forRoot(options?:any): ModuleWithProviders {
    //AoT
    //https://gist.github.com/chuckjaz/65dcc2fd5f4f5463e492ed0cb93bca60
    //ConfigService.setDefaultConfig(options||{});    
    return {
      ngModule: Kng2CoreModule,
      providers: [
        IsAuthenticated,
        CategoryService,
        ProductService,
        ConfigService,
        LoaderService,
        OrderService,
        UserService,
        ShopService,
        {
          provide:KNG2_OPTIONS,
          useValue:options||{}
        }
      ]
    };
  }  
}
