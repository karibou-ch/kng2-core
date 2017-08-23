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
    selector: 'app-produit',
    templateUrl: './produit.component.html',
    styleUrls: ['./produit.component.scss']
})
export class ProduitComponent implements OnInit {

    sku: number;
    currentUser: User;
    isReady: boolean;
    config: any;
    product: Product = new Product();

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
