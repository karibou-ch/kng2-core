import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { IsAuthenticated, IsAdmin } from './is-authenticated.service';

import { CartService } from './cart.service';
import { CategoryService } from './category.service';
import { DocumentService } from './document.service';
import { ProductService } from './product.service';
import { ConfigService } from './config.service';
import { LoaderService,
         LoaderResolve, 
         UserResolve} from './loader.service';
import { OrderService } from './order/order.service';
import { UserService } from './user.service';
import { ShopService } from './shop.service';
import { PhotoService } from './photo.service';



//
// directives & pipes
import { bgSrcDirective } from './util.bg-src.directive';
import { ConfirmDeleteDirective } from './util.confirm-delete.directive';
import { OrderPortionPipe, OrderBasepricePipe, OrderBasepricePipeEx } from './order/order.pipe.portion';
import { MarkdownDirective } from './util.markdown.directive';
import { ReportingService } from './reporting.service';
import { HubService } from './hub.service';
import { AnalyticsService } from './metrics.service';
import { OneClickDirective } from './util.one-click.directive';

//
// dynamic injection of module configuration
// export const KNG2_OPTIONS = new InjectionToken<any>('KNG2_OPTIONS');


@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  declarations: [
    bgSrcDirective, 
    ConfirmDeleteDirective, 
    MarkdownDirective,
    OneClickDirective,
    OrderPortionPipe, 
    OrderBasepricePipeEx,
    OrderBasepricePipe
  ],
  exports: [
    bgSrcDirective, 
    ConfirmDeleteDirective, 
    MarkdownDirective,
    OneClickDirective,
    OrderPortionPipe, 
    OrderBasepricePipeEx,
    OrderBasepricePipe,
  ]
})
export class Kng2CoreModule {
  //https://angular-2-training-book.rangle.io/handout/modules/feature-modules.html
  public static forRoot(options:any): ModuleWithProviders<Kng2CoreModule> {

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
          useValue: options || {}
        },
        AnalyticsService,
        CartService,
        CategoryService,
        ConfigService,
        DocumentService,
        IsAuthenticated,
        IsAdmin,
        HubService,
        LoaderService,
        LoaderResolve,
        OrderService,
        PhotoService,
        ProductService,
        ShopService,
        ReportingService,
        UserService,
        UserResolve
      ]
    };
  }  
}
