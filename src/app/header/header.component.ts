import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Config, LoaderService, User, UserService } from '../../../';




@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  user: User = new User();
  config: Config;
  isAuthenticated;

  constructor(
    private loaderSrv: LoaderService,
    private userSrv: UserService,
    private _router: Router
  ) {

    loaderSrv.ready().subscribe((loader) => {
      this.config = loader[0];
      Object.assign(this.user, loader[1]);
      this.isAuthenticated = this.user.isAuthenticated();
    })

  }

  ngOnInit() {
  }

  logout() {
    this.userSrv.logout().subscribe(() => this._router.navigateByUrl('/login'));
  }

}
