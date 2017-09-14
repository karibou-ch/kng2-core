import { Component, OnInit } from '@angular/core';
import { ConfigService, LoaderService, UserService, config } from '../../../../';


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
      private loader: LoaderService
  ) { }

  ngOnInit() {
      this.loader.ready().subscribe(result=>{
        this.config = result[0];
        // console.log('--------------------',this.config)
      });
  }



}
