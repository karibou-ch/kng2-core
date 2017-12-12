import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoaderService,
    ProductService,
    Product,
    User,
    UserService,
    Category,
    CategoryService,
    config } from '../../../../dist/';

@Component({
    selector: 'app-product-create',
    templateUrl: './product-create.component.html',
    styleUrls: ['./product-create.component.scss']
})
export class ProductCreateComponent implements OnInit {

    constructor(
        private $loader: LoaderService,
        private route: ActivatedRoute,
        private $product: ProductService,
        private $category: CategoryService,
    ) { }

    @Input()
    slug: string;
    private currentUser: User;
    private isReady: boolean;
    private config: any;
    private product: Product = new Product();
    private catalogs: Array<Category> = new Array;
    private error: any;

    ngOnInit() {
        this.$loader.ready().subscribe(ready => {
            this.isReady = true;
            this.config = ready[0];
            this.currentUser = ready[1];

            //this.$category.select().subscribe(res => this.catalogs);
            //Loading categorys before the if new Instance
            this.$category.select().subscribe(res => {
                this.catalogs = res.filter(res => res.type == "Category").sort((a, b) => a.weight - b.weight);
            });
        });

    }

    onSave() {
        this.product.categories = this.product.categories._id;
        this.$product.create(this.product).subscribe(this.onDone, this.onError);
    }

    
    onDone(p:Product){
        this.product = p;
    }

    onError(error){
        this.error = error;
    }

}
