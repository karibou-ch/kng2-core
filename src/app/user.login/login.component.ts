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
    })
  }

  login() {
    this.loading = true;  //to hide submit button after submitting
    let sub = this.loaderSrv.ready()
      .take(1)
      .flatMap(e =>
        this.userSrv.login({
          email: this.model.email,
          password: this.model.password,
          provider: "local"
        })
      )
      .subscribe(
      user => {
        this.status = "logged";
        console.log("logged", user);
        this.loading = false;
        //this.router.navigate([this.returnUrl]);

      },
      error => {
        console.log(error);
        this.status = "error";
        this.loading = false;
      });

  }

  logout() {
    this.loaderSrv.ready()
      .take(1)
      .flatMap(e =>
        this.userSrv.logout()
      )
      .subscribe(() => {
        this.model = {};
        this.loading = false;
        //this._router.navigate(['Login']);
      });

  }


}
