import { Component } from '@angular/core';
import { ConfigService, LoaderService } from '../../../dist';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    private config: ConfigService,
    private loader: LoaderService
  ) {

  }

  ngOnInit(){
    this.config.setDefaultConfig({
       API_SERVER:'http://localhost:4000'
    });
    this.loader.ready().subscribe();
  }
}
