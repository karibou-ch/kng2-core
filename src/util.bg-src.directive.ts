import { Directive, ElementRef, Input, OnInit } from '@angular/core';

import { Observable } from 'rxjs/Observable';

@Directive({
  selector: '[bgSrc]'
})

//
// https://stackoverflow.com/questions/41274603/observable-of-component-attribute-changes-in-angular2
export class bgSrcDirective implements OnInit {

  public grandient: string = `linear-gradient(
    rgba(0, 0, 0, 0.0),
    rgba(0, 0, 0, 0.5)
  ),`;

  @Input() public bgSmall: string;
  @Input() public bgGradient: boolean;
  public element;

  constructor(el: ElementRef) {
    this.element = el.nativeElement;
  }

  @Input() set bgSrc(url) {
    //
    // safe approach
    if (!url) {return; }
    const prefix = (this.bgGradient) ? this.grandient : '';
    if (this.bgSmall) {
      url += '-/resize/300x/';
    } else {
      url += '-/progressive/yes/';
    }

    this.element.style.backgroundImage = prefix + 'url(' + url + ')';

  }

  public ngOnInit() {
  }

}
