import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  CategoryService,
  Category,
  LoaderService,
  User,
  UserService,
  config
}  from '../../../../dist/';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  isReady:boolean = false;
  config:any;
  categories:Category[]=[];

  constructor(
    private $loader: LoaderService,
    private $categorySrv: CategoryService,
    private router: Router
  ){

  }

  ngOnInit() {
    this.$loader.ready().subscribe((loader) => {
      this.isReady=true;
      this.config=loader[0];
      this.loadCategories()
    });
  }

  loadCategories(){
    this.$categorySrv.select().subscribe((categories:Category[])=>{
      this.categories=categories.sort((a,b)=>a.weight-b.weight);
    });
  }

  onNewCategory(route){
    this.router.navigate(route);
  }
}
