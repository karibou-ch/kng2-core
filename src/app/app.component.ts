import { Component } from '@angular/core';
import { LoaderService } from '../../'
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app works!';

  constructor(private loaderSrv: LoaderService) {
    this.loaderSrv.ready().subscribe(() =>
      null// if (e) console.log('app ready!',e[1]
      );
  }
}
