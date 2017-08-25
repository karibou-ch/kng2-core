import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoaderService, User, UserService } from '../../../../dist'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  user: User = new User(null);

  constructor(
    private loaderSrv: LoaderService,
    private _router: Router,
    private userSrv: UserService
  ) { }

  ngOnInit() {
     this.loaderSrv.ready().subscribe(
       (loader) => {
         Object.assign(this.user, loader[1]);
       })
  }

}
