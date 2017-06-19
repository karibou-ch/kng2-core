import { Component, OnInit } from '@angular/core';
import { Config } from '../../../module/config'
import { LoaderService } from '../../../module/loader.service'
import { Router } from '@angular/router';
import { User, UserService } from '../../../module/user.service'




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
    this.userSrv.logout().subscribe();
  }

}
