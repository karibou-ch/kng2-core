//
// module
export { Kng2CoreModule } from './kng2-core.module';

//
// services
export { ConfigService } from './config.service';

export { CalendarService, ProductOrderTiming } from './calendar.service';

export { AnalyticsService, Metrics } from './metrics.service';

export { Assistant,
         AssistantService,
         AssistantState,
         AssistantStep,
         AssistantMessage,
         ClientDiscussion,
         Usage,
         parseSteps } from './assistant.service';

export { CartAction,
         CartConfig,
         CartModel,
         CartItem,
         CartItemsContext,
         CartService,
         CartSchedulerStatus,
         CartItemFrequency,
         CartSubscription,
         CartSubscriptionParams,
         CartSubscriptionProductItem,
         CartSubscriptionServiceItem,
         CartState } from './cart.service';

export { Category,
         CategoryService } from './category.service';

export { Document,
         DocumentHeader,
         DocumentService } from './document.service';

export { IsAuthenticated, IsAdmin } from './is-authenticated.service';

export { LoaderService,
         LoaderResolve,
         UserResolve,
         LoaderData,
         LoaderCoreData } from './loader.service';

export { Order,
         OrderItem, OrderAddress } from './order/order';
export { OrderService, OrderCustomerInvoices } from './order/order.service';

export { Photo,
         PhotoService } from './photo.service';

export { Product,
         ProductPortion,
         ProductService } from './product.service';

export { Shop,
         ShopService } from './shop.service';

export { Hub,
         HubService } from './hub.service';

export { ReportOrders,
         ReportCustomer,
         ReportIssues,
         ReportOrderIssue,
         ReportingService } from './reporting.service';

export { User,
         UserCard,
         UserAddress,
         DepositAddress,
         ShippingAddress,
         UserService,
         CustomerChurn } from './user.service';

export { EnumCancelReason,
         EnumFinancialStatus,
         EnumFulfillments,
         EnumOrderIssue,
         EnumShippingMode
       } from './order/order.enum';


export * from './util';
//
// directives & pipes
export { MarkdownDirective } from './util.markdown.directive';
export { bgSrcDirective } from './util.bg-src.directive';
export { OneClickDirective } from './util.one-click.directive';
export { ConfirmDeleteDirective } from './util.confirm-delete.directive';
export { OrderPortionPipe, OrderBasepricePipe, OrderBasepricePipeEx } from './order/order.pipe.portion';

//
// export variable instance
export { Config,
         ConfigKeyStoreEnum,
         ConfigMenu,
         config } from './config';

