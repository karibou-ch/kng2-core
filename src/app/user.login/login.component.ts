import { Component, OnInit } from '@angular/core';
import { LoaderService } from '../../../module/loader.service'
import { Router } from '@angular/router';
import { User } from '../../../module/user.service'
import { UserService } from '../../../module/user.service'


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  user: User;
  model: any = {};
  loading = false;
  status;
  semaphore = true;
  isReady:boolean=false;


  constructor(
    private userSrv: UserService,
    private loaderSrv: LoaderService,
    private _router: Router
  ) {

  }

  ngOnInit() {
    this.loaderSrv.ready().subscribe((loader) => {
      console.log('user object', loader[1]);
      this.user = loader[1];
      this.isReady=true;
    })
  }

  login() {
    this.loading = true;  //to hide submit button after submitting
    this.userSrv.login({
      email: this.model.email,
      password: this.model.password,
      provider: "local"
    }).subscribe(
    () => this._router.navigate(['/dashboard'])
    );  

  }

  logout() {
    this.userSrv.logout().subscribe(
      () => this._router.navigate(['/login'])
    );
  }


}
