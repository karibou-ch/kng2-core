import { Component } from '@angular/core';
import { ConfigService, LoaderService } from '../../../dist';

ConfigService.setDefaultConfig({
    API_SERVER:'http://api.panierlocal.evaletolab.ch'
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
  ) {}


  ngOnInit(){
    this.loader.ready().subscribe();
  }
}
