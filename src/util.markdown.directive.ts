import { AfterViewInit, Input, ElementRef, Component, ViewEncapsulation } from '@angular/core';

// import { Prism } from 'prism';
// import 'prism/themes/prism-okaidia.css!css';


//
// original script
// https://github.com/dimpu/ngx-md/blob/master/src/markdown/markdown.component.ts
@Component({
  selector: 'kng-markdown,[kng-markdown]',
  template: '<ng-content></ng-content>',
  encapsulation: ViewEncapsulation.None
})
export class MarkdownDirective implements AfterViewInit {


  @Input()
  set data(value: string) {
    this.fromData(value || '');
  }

  @Input('kng-markdown')
  set kMarkdown(value: string) {
    this.fromData(value || '');
  }

  constructor(
    private elementRef: ElementRef
  ) {
    this.element = this.elementRef.nativeElement;
    this.html = '';



  }
  static converter = null;

  html: string;

  @Input() removeRoot= false;

  @Input() src;

  element;

  // # Example inline style link with custom href attributes
  // [No title or custom attributes](https://example.org)
  // [Title & no custom attribute](https://example.org "A title")
  // [No title but custom attribute](https://example.org)(rel="nofollow")
  // [Title & custom attributes](https://example.org "A title")(rel="nofollow" class="btn btn-primary")
  sdExtAttr;

  ngAfterViewInit() {
    this.elementRef.nativeElement.innerHTML = this.html;
  }


  fromData(data) {
    if (!data || !data.length) {
      return;
    }
    const raw = data;
    this.process(this.prepare(raw)).then(html => {
      this.html = html;
      this.highlight(html);
      this.elementRef.nativeElement.innerHTML = html;
    });
  }

  fromRAW() {
    const raw = this.elementRef.nativeElement.innerHTML;
    if (!raw || !raw.length) {
      return;
    }
    this.process(this.prepare(raw)).then(html => {
      this.html = html;
      this.highlight(html);
      this.elementRef.nativeElement.innerHTML = html;
    });
  }
  prepare(raw) {
    return raw.split('\n').map((line) => line.trim()).join('\n');
  }

  process(markdown): Promise<string> {

    return import('markdown-it').then(module => {
      if(!MarkdownDirective.converter) {
        MarkdownDirective.converter = new module.default({
          html:true,
          breaks:true,
          typographer:true
        });  
      }
      if(this.removeRoot) {
        return MarkdownDirective.converter.renderInline(markdown);
      }
      return MarkdownDirective.converter.render(markdown);
    })

    // Showdown.extension('extAttributes', this.sdExtAttr);
    // MarkdownDirective.converter = new Showdown.Converter({ extensions: ['extAttributes'] });
    // return Utils.script(CDNJS_SHOWDOWN, 'showdown')
    //      .toPromise().then((showdown: any) => {
    //   showdown.extension('extAttributes', this.sdExtAttr);
    //   MarkdownDirective.converter = new showdown.Converter({
    //     emoji: true,
    //     parseImgDimensions: true,
    //     simplifiedAutoLink: true
    //   });

    //   const md = MarkdownDirective.converter.makeHtml(markdown);
    //   return (md);
    // });
  }

  highlight(html) {
    // Prism.highlightAll();
  }
}
