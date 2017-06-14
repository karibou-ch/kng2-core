import { Component, OnInit } from '@angular/core';
import { LoaderService }  from '../../../module/loader.service'

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  username : string = 'Anonyme';
  constructor(private loaderSrv : LoaderService) { }

  ngOnInit() {
  }

}
