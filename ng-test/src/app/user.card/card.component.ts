import { Component, Input } from '@angular/core';
import { LoaderService, User, UserService } from '../../../../dist'

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {

  @Input() card: String[];

}
