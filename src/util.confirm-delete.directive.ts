import { Component, ElementRef, EventEmitter, Input, Output, OnInit } from '@angular/core';

import { Observable } from 'rxjs/Observable';

@Component({
  selector: '[confirm-delete]',
  template: `
    <form id="passwd-{{id}}" style="'+style+'" class="form-inline prompt-passwd" validate>
      <input type="password" class="form-control" placeholder="valider avec votre mot de passe" required autofocus="true" style="width: 280px;">
      <button class="btn btn-primary" ><i class="fa fa-unlock"></i></button>
    </form>
  `
})

//
// https://stackoverflow.com/questions/41274603/observable-of-component-attribute-changes-in-angular2
export class ConfirmDeleteDirective implements OnInit{
  @Output() onconfirm: EventEmitter<any> = new EventEmitter();
  element;
  style;
  id:number=0;
  constructor(el: ElementRef) { 
    this.element=el.nativeElement;
    this.style="z-index:1;left:0;right:0;min-width: 350px;position: absolute;border: 2px solid red;padding: 10px;background-color: white;margin-top:-20px;display:none;left:25%;box-shadow:1px 1px 1000px #333";
    this.id++;
  }

  @Input() set bgSrc(url) {
    // if(!url)return;    
    // this.element.style.backgroundImage = "url("+url+")";
  }

  ngOnInit(){
    this.element.keyup((e)=> {
      if (e.keyCode == 27) {
        this.element.next('.prompt-passwd').remove();  
      }
    });
    this.element.bind('click', (event)=> {
      //
      //angular.element('.prompt-passwd').hide();
      this.element.next().show();
    });
    this.element.next().submit(()=>{
      let pwd=this.element.next().find('input[type=password]').val();
      //scope.action({password:pwd});
      this.onconfirm.emit(this.id);
      this.element.next().hide('.prompt-passwd');
      return false;
    });
    
  }


}