import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {
    ProductService,
    Product,
    LoaderService,
    User,
    UserService,
    config
}  from '../../../../dist'


@Component({
    selector: 'app-product',
    templateUrl: './product.component.html',
    styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit {

    sku: number;
    currentUser: User;
    isReady: boolean;
    config: any;
    product: Product;

    constructor(
        private $loader: LoaderService,
        private $product: ProductService,
        private route: ActivatedRoute
    ) {

    }

    ngOnInit() {
        this.$loader.ready().subscribe((loader) => {
            this.isReady = true;
            this.config = loader[0];
            this.currentUser = loader[1];

            if (!this.sku) {
                this.sku = this.route.snapshot.params['sku'];
            }

            this.$product.findBySku(this.sku).subscribe(prod => this.product = prod)
        });
    }



}
