import { Component, OnInit } from '@angular/core';
import { LoaderService } from '../../../module/loader.service'
import { Router } from '@angular/router';
import { User } from '../../../module/user.service'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  user: User = new User();

  constructor(
    private loaderSrv: LoaderService,
    private _router: Router
  ) { }

  ngOnInit() {
    this.loaderSrv.ready().subscribe(
      (loader) => {
        Object.assign(this.user, loader[1]);
      })
  }

}