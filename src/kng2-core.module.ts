import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
// TODO
// import { HttpClientModule } from '@angular/common/http';

import { IsAuthenticated, IsAdmin } from './is-authenticated.service';

import { CartService } from './cart.service';
import { CategoryService } from './category.service';
import { DocumentService } from './document.service';
import { ProductService } from './product.service';
import { ConfigService } from './config.service';
import { LoaderService } from './loader.service';
import { OrderService } from './order/order.service';
import { UserService } from './user.service';
import { ShopService } from './shop.service';

import { Config, ConfigKeyStoreEnum } from './config';


//
// directives & pipes
import { bgSrcDirective } from './util.bg-src.directive';
import { ConfirmDeleteDirective } from './util.confirm-delete.directive';
import { OrderPortionPipe, OrderBasepricePipe } from './order/order.pipe.portion';
import { MarkdownDirective } from './util.markdown.directive';

//
// dynamic injection of module configuration
// export const KNG2_OPTIONS = new InjectionToken<any>('KNG2_OPTIONS');


@NgModule({
  imports: [
    CommonModule,
    HttpModule
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
  //https://angular-2-training-book.rangle.io/handout/modules/feature-modules.html
  public static forRoot(options:any): ModuleWithProviders {

    // try{
    //   let server=localStorage.getItem(ConfigKeyStoreEnum[ConfigKeyStoreEnum.KIO2_SERVER]);
    //   options.API_SERVER=server||options.API_SERVER;
    // }catch(e){
    //   console.log('--- localStorage',e);
    // }
    

    return {
      ngModule: Kng2CoreModule,
      providers: [
        {
          provide:"KNG2_OPTIONS",
          useValue:options||{}
        },
        CartService,
        CategoryService,
        ConfigService,
        DocumentService,
        IsAuthenticated,
        IsAdmin,
        LoaderService,
        OrderService,
        ProductService,
        ShopService,
        UserService
      ]
    };
  }  
}
