import { Component, OnInit } from '@angular/core';
import {
    ProductService,
    Product,
    LoaderService,
    User,
    UserService,
    config
}  from '../../../../dist'

@Component({
    selector: 'app-product-list',
    templateUrl: './product-list.component.html',
    styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {

    isReady: boolean = false;
    config: any;
    products: Product[] = [];

    constructor(
        private loader: LoaderService,
        private $product: ProductService
    ) {

    }

    ngOnInit() {
        this.loader.ready().subscribe((loader) => {
            this.isReady = true;
            this.config = loader[0];
            //this.loadLovedProduct(); //pout un test
            this.loadProducts()
        });
    }

    loadProducts() {
        this.$product.select().subscribe((products: Product[]) => {
            this.products = products.sort();
        });
    }

    loadLovedProduct() {
        this.$product.findLove().subscribe((products: Product[]) => {
            this.products = products.sort();
        });
    }

}
