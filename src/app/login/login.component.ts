import { Component, OnInit } from '@angular/core';
import { UserService }  from '../../../module/user.service'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private userS : UserService) { }

  ngOnInit() {
  }

}
