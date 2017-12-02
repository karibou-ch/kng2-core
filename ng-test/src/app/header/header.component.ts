import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { config, LoaderService, User, UserService } from '../../../../';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  user: User = new User();
  config;

  constructor(
    private $loader: LoaderService,
    private $user: UserService,
    private $router: Router
  ) {


  }

  ngOnInit() {
    this.$loader.ready().subscribe(loader =>{
      this.config = config;
      Object.assign(this.user, loader[1]);
    });

  }

  logout() {
    this.$user.logout().subscribe(() => this.$router.navigateByUrl('/login'));
  }

}
