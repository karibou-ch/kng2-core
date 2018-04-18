//
// module 
export { Kng2CoreModule } from './kng2-core.module';

//
// services
export { ConfigService } from './config.service';

export { CartAction,
         CartConfig,
         CartItem,
         CartService,
         CartState } from './cart.service';

export { Category, 
         CategoryService } from './category.service';

export { Document, 
         DocumentService } from './document.service';
          
export { IsAuthenticated, IsAdmin } from './is-authenticated.service';

export { LoaderService } from './loader.service';

export { Order, 
         OrderItem } from './order/order';
export { OrderService } from './order/order.service';

export { Product, 
         ProductService } from './product.service';

export { Shop, 
         ShopService } from './shop.service';

export { User, 
         UserCard, 
         UserAddress, 
         UserService } from './user.service';

export { EnumCancelReason,
         EnumFinancialStatus,
         EnumFulfillments,
         EnumOrderIssue,
         EnumShippingMode
       } from './order/order.enum';

//
// directives & pipes
export { bgSrcDirective } from './util.bg-src.directive';
export { ConfirmDeleteDirective } from './util.confirm-delete.directive';
export { OrderPortionPipe, OrderBasepricePipe } from './order/order.pipe.portion';

//
// export variable instance
export { Config, ConfigKeyStoreEnum, config } from './config';

