import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../module/user.service'
import { User } from '../../../module/user.service'
import { LoaderService }  from '../../../module/loader.service'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  user: User;
  model: any = {}
  loading = false;

  constructor(private userS: UserService, private loaderSrv: LoaderService) { }

  ngOnInit() {

  }

  login() {
    this.loading = true;  //to hide submit button after submitting
    this.loaderSrv.ready().subscribe((e) => {
      if(e) console.log('app ready!',e[1]);
    });
    this.userS.login({"username" : this.model.name, "password" : this.model.password})
      .subscribe(
      data => {
        Object.assign(this.user, data)
        //this.router.navigate(['home']);
      },
      error => {
        //error handler
      });
  }

}
