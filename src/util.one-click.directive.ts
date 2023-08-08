import { Directive, ElementRef, HostListener, Input } from '@angular/core';


@Directive({
  selector: '[one-click]'
})
export class OneClickDirective {
  @Input() debounceTime = 500;

  constructor(private $elem: ElementRef) { }
  @HostListener('click', ['$event'])
  clickEvent() {
    const $ref = this.$elem;
    $ref.nativeElement.setAttribute('disabled', 'true');
    setTimeout(() => {
      try {
        $ref.nativeElement.removeAttribute('disabled');
      }catch(err) {}
    }, this.debounceTime);
  }
}