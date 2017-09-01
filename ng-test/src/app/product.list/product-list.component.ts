import { Component, OnInit } from '@angular/core';
import {
    ProductService,
    Product,
    LoaderService,
    User,
    UserService,
    Category,
    CategoryService,
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
    password: string;
    catalogs: Array<Category> = new Array;
    selectCat: Category;

    constructor(
        private loader: LoaderService,
        private $product: ProductService,
        private $category: CategoryService,
    ) {

    }

    ngOnInit() {
        this.loader.ready().subscribe((loader) => {
            this.isReady = true;
            this.config = loader[0];
            //this.loadLovedProduct(); //pour un test
            this.loadProducts();
            this.$category.select().subscribe(res => {
                this.catalogs = res.filter(res => res.type == "Category").sort();
            });
        });
    }

    loadProducts() {
        this.$product.select().subscribe((products: Product[]) => {
            this.products = products.sort();
        });
    }

    filterProduct() {
        this.$product.findByCategory(this.selectCat.slug).subscribe((products: Product[]) => {
            this.products = products.sort();
        });
    }

    loadLovedProduct() {
        this.$product.findLove().subscribe((products: Product[]) => {
            this.products = products.sort();
        });
    }

    onDelete(prod: Product) { // still not working
        this.$product.remove(prod.sku, this.password).subscribe();
    }

}
