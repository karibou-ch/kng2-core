import { Component, Input } from '@angular/core';
import { LoaderService, User, Address, UserService } from '../../../../dist'

@Component({
  selector: 'app-address',
  templateUrl: './address.component.html',
  styleUrls: ['./address.component.scss']
})
export class AddressComponent {

  @Input() address: Address[];

}
