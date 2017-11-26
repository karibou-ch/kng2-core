import { Directive, ElementRef, Input, OnInit } from '@angular/core';

import { Observable } from 'rxjs/Rx';

@Directive({
  selector: '[bgSrc]'
})

//
// https://stackoverflow.com/questions/41274603/observable-of-component-attribute-changes-in-angular2
export class bgSrcDirective implements OnInit{
  @Input() bgSmall : Observable<string>;
  element;

  constructor(el: ElementRef) { 
    this.element=el.nativeElement;
  }

  @Input() set bgSrc(url) {
    if(!url)return;
    if(this.bgSmall) {
      // url='http://cdn.filter.to/300x1000/'+url.replace('https','http')
      // url=config.API_SERVER+'/v1/cdn/image/305x1000?source='+url.replace('https','http')
      url+='-/resize/300x/';
    }else{
      url+='-/progressive/yes/';
    }
    
    this.element.style.backgroundImage = "url("+url+")";

  }

  ngOnInit(){
  }


}
