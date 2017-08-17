import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { config, LoaderService, User, UserService } from '../../../../dist';




@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  user: User = new User();
  config;
  isAuthenticated;

  constructor(
    private loaderSrv: LoaderService,
    private userSrv: UserService,
    private _router: Router
  ) {


  }

  ngOnInit() {
    
    this.loaderSrv.ready().subscribe(
    loader => {
      this.config = config;
      Object.assign(this.user, loader[1]);
      this.isAuthenticated = this.user.isAuthenticated();
    },
    error => {
      //
      // error.status===0 means no api access!!
    })

  }

  logout() {
    this.userSrv.logout().subscribe(() => this._router.navigateByUrl('/login'));
  }

}
