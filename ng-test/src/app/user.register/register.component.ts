import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoaderService, User, UserService } from '../../../../dist'

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {


  user: any = {};
  loading = false;

  constructor(
    private $user: UserService,
    private $loader: LoaderService,
    private _router: Router
  ) {

  }

  ngOnInit() {

  }

  register() {
    this.loading = true;
    this.$user.register(this.user).subscribe();

  }


}
