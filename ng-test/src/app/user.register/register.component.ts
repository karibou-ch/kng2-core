import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoaderService, User, UserService } from '../../../..'

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {


  user: any = {};
  loading = false;
  isReady: boolean = false;
  status;
  semaphore = true;


  constructor(
    private userSrv: UserService,
    private loaderSrv: LoaderService,
    private _router: Router
  ) {

  }

  ngOnInit() {

  }

  register() {
    this.loading = true;
    this.userSrv.register(this.user).subscribe();

  }


}
