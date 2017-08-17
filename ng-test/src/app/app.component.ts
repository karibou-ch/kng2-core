import { Component } from '@angular/core';
import { LoaderService } from '../../../dist';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private loaderSrv: LoaderService) {

  }

  ngOnInit(){
    this.loaderSrv.ready().subscribe();
  }
}
