import { Component } from '@angular/core';
import { ConfigService, LoaderService } from '../../../dist';

ConfigService.setDefaultConfig({
    API_SERVER:'http://localhost:4200'
});

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
    this.loader.ready().subscribe();
  }
}
