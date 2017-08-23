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
    selector: 'app-produit-list',
    templateUrl: './produit-list.component.html',
    styleUrls: ['./produit-list.component.scss']
})
export class ProduitListComponent implements OnInit {

    isReady: boolean = false;
    config: any;
    products: Product[] = [];

    constructor(
        private loader: LoaderService,
        private productSrv: ProductService
    ) {

    }

    ngOnInit() {
        this.loader.ready().subscribe((loader) => {
            this.isReady = true;
            this.config = loader[0];
            this.loadProducts()
        });
    }

    loadProducts() {
        this.productSrv.select().subscribe((products: Product[]) => {
            this.products = products.sort();
        });
    }

}
