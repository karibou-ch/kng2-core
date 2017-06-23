import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
import { Config } from './config';
import { User } from './user.service';
import { ConfigService } from './config.service';
import { UserService } from './user.service';
import { CategoryService } from './category.service';
export declare class LoaderService {
    private http;
    private configSrv;
    private userSrv;
    private categorySrv;
    private loader;
    constructor(http: Http, configSrv: ConfigService, userSrv: UserService, categorySrv: CategoryService);
    ready(): Observable<[Config, User]>;
}
