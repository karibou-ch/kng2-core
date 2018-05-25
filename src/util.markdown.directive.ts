import { AfterViewInit, Directive,Input, ElementRef, Component, ViewEncapsulation } from '@angular/core';
import { Http } from '@angular/http';

import Showdown from 'showdown';
// import { Prism } from 'prism';
// import 'prism/themes/prism-okaidia.css!css';


// Showdown typescript
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/7ba0c54fa401f1ccc969b4c6923ed0c636a86002/types/showdown/index.d.ts
// declare namespace Showdown {
//   export interface Converter{
//     makeHtml(content:string);
//   }
// }

//
// original script
// https://github.com/dimpu/ngx-md/blob/master/src/markdown/markdown.component.ts
@Component({
  selector: 'kng-markdown,[kng-markdown]',
  template: '<ng-content></ng-content>',
  encapsulation: ViewEncapsulation.None
})
export class MarkdownDirective implements AfterViewInit{

  html:string;

  @Input()
  removeRoot:boolean=false;

  @Input()
  src;

  @Input()
  set data(value: string) {
    this.fromData(value||'');
  }  

  @Input('kng-markdown')
  set kMarkdown(value: string) {
    this.fromData(value||'');
  }  

  element;
  static converter=null;

  // # Example inline style link with custom href attributes
  // [No title or custom attributes](https://example.org)
  // [Title & no custom attribute](https://example.org "A title")
  // [No title but custom attribute](https://example.org)(rel="nofollow")
  // [Title & custom attributes](https://example.org "A title")(rel="nofollow" class="btn btn-primary")
  sdExtAttr;

  constructor (
    private elementRef:ElementRef, 
    private http:Http
  ) {
    this.element = this.elementRef.nativeElement;
    this.html='';
    
    // https://guides.codechewing.com/add-custom-attributes-to-anchor-html-tag-showdown
    // Our custom extension
    this.sdExtAttr = {
      type: 'output',
      regex: /()\((.+=".+" ?)+\)/g,
      replace: (match, $1, $2) => {
        return $1.replace('">', `" ${$2}>`);
      }
    };
    
        
  }

  ngAfterViewInit () {
    this.elementRef.nativeElement.innerHTML = this.html;
  }


  fromData(data) {
    if(!data.length){
      return;
    }
    let raw = data;    
    this.html = this.process(this.prepare(raw));
    this.highlight(this.html);
    this.elementRef.nativeElement.innerHTML = this.html;
  }

  fromRAW() {
    let raw = this.elementRef.nativeElement.innerHTML;
    if(!raw.length){
      return;
    }
    this.html = this.process(this.prepare(raw));
    this.highlight(this.html);
    this.elementRef.nativeElement.innerHTML = this.html;
  }
  prepare(raw) {
    return raw.split('\n').map((line) => line.trim()).join('\n')
  }

  process(markdown) {

    if(!MarkdownDirective.converter){
      Showdown.extension('extAttributes', this.sdExtAttr);
      MarkdownDirective.converter = new Showdown.Converter({ extensions: ['extAttributes'] });  
    }
      
    let md=MarkdownDirective.converter.makeHtml(markdown);
    //
    // so nice hack to remove root paragraph
    // TODO should be 
    if(md.indexOf('<p>')===0&&this.removeRoot){
      return md.substring(3, md.length - 5);      
    }
    
    return md;
  }

  // process(markdown):Promise<string> {
  //   return import("showdown").then(Showdown => {
  //     let converter = new Showdown['Converter']();
  //     let md=converter.makeHtml(markdown),end;
  //     //
  //     // so nice hack to remove root paragraph
  //     // TODO should be 
  //     if(md.indexOf('<p>')===0&&this.removeRoot){
  //       return md.substring(3, md.length - 5);      
  //     }
  //     return md;        
  //   });
  // }
  
  highlight(html){
    //Prism.highlightAll();
  }
}
