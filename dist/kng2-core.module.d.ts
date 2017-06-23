import { AuthGuardService } from './auth-guard.service';
import { Category, CategoryService } from './category.service';
import { ConfigService } from './config.service';
import { LoaderService } from './loader.service';
import { OrderService } from './order/order.service';
import { Order } from './order/order';
import { UserPipe } from './user.pipe';
import { User, Shop, UserService } from './user.service';
export declare class Kng2CoreModule {
}
export { AuthGuardService, CategoryService, Category, ConfigService, LoaderService, OrderService, Order, UserPipe, UserService, User, Shop };
export * from './order/order.enum';
export { Config } from './config';
