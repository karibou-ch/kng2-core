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
  user: User;
  config: Config;

  constructor(
    private loaderSrv: LoaderService,
    private userSrv: UserService,
    private _router: Router
  ) {

    loaderSrv.ready().subscribe((loader) => {
      this.config = loader[0];
      this.user = loader[1];
    })

  }

  ngOnInit() {
  }

  logout() {
    this.loaderSrv.ready()
      .take(1)
      .flatMap(e =>
        this.userSrv.logout()
      )
      .subscribe(() => {
        console.log('logging out');
        this._router.navigate(['/login']);
      });

  }

}
