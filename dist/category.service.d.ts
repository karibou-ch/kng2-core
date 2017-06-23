import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { ConfigService } from './config.service';
export interface QueryFilter {
    stats?: boolean;
}
export declare class Category {
    slug: string;
    group: string;
    _id: any;
    cover: string;
    description: string;
    image: string;
    name: string;
    weight: any;
    type: string;
    home: boolean;
    active: boolean;
}
export declare class CategoryService {
    private http;
    private configSrv;
    config: any;
    private defaultCategory;
    private cache;
    private updateCache(cat);
    private deleteCache(cat);
    private addCache(category);
    private headers;
    constructor(http: Http, configSrv: ConfigService);
    getCurrent(): void;
    findNameBySlug(slug: any): void;
    findBySlug(slug: any): any;
    findByGroup(name: any): Category[];
    select(filter?: any): Observable<Category[]>;
    get(slug: any): Observable<Category>;
    save(slug: any, cat: Category): Observable<Category>;
    create(cat: Category): Observable<Category>;
    remove(slug: any, password: any): Observable<any>;
    private handleError(error);
}
