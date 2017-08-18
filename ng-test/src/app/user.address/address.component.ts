import { Component, OnInit } from '@angular/core';
import { LoaderService, User, UserService } from '../../../../dist'

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss']
})
export class AddressComponent implements OnInit {

  user: User = new User();

  constructor(
    private loaderSrv: LoaderService,
    private userSrv: UserService
  ) { }

  ngOnInit() {
     this.loaderSrv.ready().subscribe(
       (loader) => {
         Object.assign(this.user, loader[1]);
       })
  }

}
