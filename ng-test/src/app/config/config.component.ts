import { Component, OnInit } from '@angular/core';
import { ConfigService, LoaderService, UserService, config } from '../../../../dist';


@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  private config = {};

  constructor(
      private configSrv: ConfigService,
      private userSrv: UserService,
      private loaderSrv: LoaderService
  ) { }

  ngOnInit() {
      this.getConfig();
  }

  getConfig() {
      return this.loaderSrv.ready().subscribe(
          res => {
              if (res) {
                  this.config = res[0];
              }
          }
      );

  }


}
