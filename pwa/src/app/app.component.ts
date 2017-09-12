import { Component, OnInit } from '@angular/core';
import { OverlayContainer } from '@angular/material';
import { Router } from '@angular/router';
import { config, ConfigService, LoaderService, User, UserService } from '../../../dist';

ConfigService.setDefaultConfig({
  API_SERVER: 'http://api.panierlocal.evaletolab.ch'
});

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

  user: User = new User();
  config;

  constructor(
    private $loader: LoaderService,
    private $user: UserService,
    private _router: Router
  ) {
  }


  ngOnInit() {
    this.$loader.ready().subscribe(loader => {
      this.config = config;
      Object.assign(this.user, loader[1]);
    });
  }


  logout() {
    this.$user.logout().subscribe(() => this._router.navigateByUrl('/login'));
  }

}
