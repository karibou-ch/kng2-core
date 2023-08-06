import { Directive, ElementRef, HostListener, Input } from '@angular/core';


@Directive({
    selector: '[one-click]'
})
export class OneClickDirective {
    @Input() debounceTime = 500;

    constructor(private elementRef: ElementRef) { }
    @HostListener('click', ['$event'])
    clickEvent() {
        this.elementRef.nativeElement.setAttribute('disabled', 'true');
        setTimeout(() => this.elementRef?.nativeElement?.removeAttribute('disabled'), this.debounceTime);
    }
}