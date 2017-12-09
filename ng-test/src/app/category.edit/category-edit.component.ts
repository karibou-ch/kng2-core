import { Component, OnInit, Input } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import { Observable } from 'rxjs/Rx';
import {
  CategoryService,
  Category,
  LoaderService,
  User,
  UserService,
  config
}  from '../../../../dist/';

@Component({
  selector: 'app-category-edit',
  templateUrl: './category-edit.component.html',
  styleUrls: ['./category-edit.component.scss']
})
export class CategoryEditComponent implements OnInit {

  newInstance:boolean=false;
  errors:any;

  // TODO, note, je propose que tous les instances des services Kng2-core
  // soient préfixés par $ (c'est pour éviter le suffix Srv)
  constructor(
    private $loader: LoaderService,
    private $category: CategoryService,
    private route:ActivatedRoute
  ){

  }

  //
  // optional input (instance of Category, or )
  @Input() slug:string;
  currentUser:User;
  isReady:boolean;
  config:any;
  category:Category=new Category();


  ngOnInit() {
    // TIPS: If you expect users to navigate from bank to bank directly,
    // without navigating to another component first, you ought
    // to access the parameter through an observable:
    // this.route.params.subscribe( params =>
    //     this.slug = params['slug'];
    // )
    this.$loader.ready().subscribe(ready=>{
      this.isReady=true;
      this.config=ready[0];
      this.currentUser=ready[1];

      //
      // on category creation there is no slug available
      this.newInstance=this.route.snapshot.data.newInstance;
      if(this.newInstance){
        return;
      }
      //
      // two options for slug initialisation : 1) Input, 2) URL
      if(!this.slug){
        this.slug=this.route.snapshot.params['slug'];
      }

      //
      // TODO manage on Error user feedback!
      this.$category.findBySlug(this.slug).subscribe(cat=>this.category=cat)

    });
  }

  onSave(){
    // TODO use error feedback for user!
    if(this.newInstance){
      return this.$category.create(this.category).subscribe();
    }
    this.$category.save(this.slug,this.category).subscribe(this.noop,this.processErrors);
  }

  //
  // no operation function
  noop(){}

  processErrors(err){
    this.errors=err;
  }
}
