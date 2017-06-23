import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoaderService, User, UserService } from '../../..'


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  user: User = new User();
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
      Object.assign(this.user, loader[1]);
      this.isReady=true;
    })
    if(this.user.isAuthenticated()) this._router.navigate(['/dashboard']);
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
