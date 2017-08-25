import { Component, OnInit, Input } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import { Observable } from 'rxjs/Rx';
import {
    ProductService,
    Product,
    LoaderService,
    User,
    UserService,
    config
}  from '../../../../dist'

@Component({
    selector: 'app-product-edit',
    templateUrl: './product-edit.component.html',
    styleUrls: ['./product-edit.component.scss']
})
export class ProductEditComponent implements OnInit {

    constructor(
        private $loader: LoaderService,
        private $product: ProductService,
        private route: ActivatedRoute
    ) { }

    @Input()
    sku: number;
    currentUser: User;
    isReady: boolean;
    config: any;
    product: Product; 

    ngOnInit() {
        this.$loader.ready().subscribe((loader) => {
            this.isReady = true;
            this.config = loader[0];
            this.currentUser = loader[1];

            if (!this.sku) {
                this.sku = this.route.snapshot.params['sku'];
            }
            console.log(this.sku)
            this.$product.findBySku(this.sku).subscribe(prod => this.product = prod)
        });
    }

    onSave() {
        // TODO use error feedback for user!
        this.$product.save(this.product).subscribe()
    }

}
