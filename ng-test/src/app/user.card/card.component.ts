import { Component, OnInit } from '@angular/core';
import { LoaderService, User, UserService } from '../../../../dist'

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {

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
