import { AfterViewInit, Directive,Input, ElementRef } from '@angular/core';
import { Http } from '@angular/http';

import Showdown from 'showdown';
// import { Prism } from 'prism';
// import 'prism/themes/prism-okaidia.css!css';

@Directive({
  selector: '[kng-markdown]'
})
export class MarkdownDirective implements AfterViewInit{

  @Input()
  removeRoot:boolean=false;

  @Input()
  src;

  @Input()
  set data(value: string) {
    this.fromData(value||'');
  }  

  element;

  constructor (
    private elementRef:ElementRef, 
    private http:Http
  ) {
    this.element = this.elementRef.nativeElement;
  }

  ngAfterViewInit () {

    // element containing markdown
    // if (!this.src) {
    //   this.fromRAW();
    // }
  }

  fromData(data) {
    let raw = data;
    let html = this.process(this.prepare(raw));
    this.element.innerHTML = html;
    this.highlight(html);
  }

  fromRAW() {
    let raw = this.element.innerHTML;
    let html = this.process(this.prepare(raw));
    this.element.innerHTML = html;
    this.highlight(html);
  }

  prepare(raw) {
    return raw.split('\n').map((line) => line.trim()).join('\n')
  }

  process(markdown) {
    let converter = new Showdown.Converter();
    let md=converter.makeHtml(markdown),end;
    //
    // so nice hack to remove root paragraph
    // TODO should be 
    if(md.indexOf('<p>')===0&&this.removeRoot){
      return md.substring(3, md.length - 5);      
    }
    return md;
  }

  highlight(html){
    //Prism.highlightAll();
  }
}
