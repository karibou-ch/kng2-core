import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../module/user.service'
import { User } from '../../../module/user.service'
import { LoaderService } from '../../../module/loader.service'
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  user: User = new User;
  model: any = {}
  loading = false;
  submitted = false;
  status;


  constructor(
    private userSrv: UserService, 
    private loaderSrv: LoaderService,
    private _router: Router
    ) { }

  ngOnInit() {
  }

  login() {
    this.loading = true;  //to hide submit button after submitting
    this.loaderSrv.ready().flatMap(e => 
       this.userSrv.login({ 
      email: this.model.email, 
      password: this.model.password, 
      provider : "local" })
       )
    .subscribe(
        user => {
          Object.assign(this.user, user);
          localStorage.setItem("user", JSON.stringify(user));
          this.status = "logged";
          this.submitted = true;
          console.log("logged",user);
          
          //this.router.navigate([this.returnUrl]);
          
        },
        error => {
          console.log(error);
          this.status = "error";
          this.submitted = true;
          this.loading = false;
          
        });
  }

  logout() {
    this.loaderSrv.ready().flatMap(e => 
      this.userSrv.logout()
    )
    .subscribe(() => {
      localStorage.removeItem("user");
      this.model = {};
      this.loading = false;
      this.submitted = false;
    //this._router.navigate(['Login']);
    });
    
  }

  getUser(){
    return localStorage.getItem("user") && JSON.parse(localStorage.getItem("user"));
  }


}
