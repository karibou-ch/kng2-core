import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoaderService, User, UserService } from '../../../../'

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  constructor(
    private $loader: LoaderService,
    private route:ActivatedRoute,
    private $user: UserService
  ) { }

  @Input() id: any;
  private currentUser: User;
  private isReady: boolean;
  private config: any;
  private user: User = new User();
  addressReady: boolean;

  ngOnInit() {

    this.$loader.ready().subscribe(ready => {
    this.isReady = true;
    this.config = ready[0];
    this.currentUser = ready[1];

    if(!this.id){
      //this.id=this.route.snapshot.params['id'];
      console.log("passer par la liste des users")
    }

      this.$user.get(this.id).subscribe(res => this.user = res);
    });
  }

  onSave(){
    // TODO use error feedback for user!
    //this.$category.save(this.slug,this.category).subscribe(this.noop,this.processErrors);
  }
}
