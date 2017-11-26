import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'portion'
})
export class OrderPortionPipe implements PipeTransform {

  roundN(val){
    if(val<=5){
      return val.toFixed(1);
    }
    if(val<=50){
      return Math.round(val);
    }
    var N=5;
    return (Math.round(val / N) * N);
  }

  transform(weight: any, def?: any): any {
    if(!def)def='';
    if (!weight) return "";
    var m=weight.match(/~([0-9.]+) ?(.+)/);
    if(!m&&def)m=def.match(/~([0-9.]+) ?(.+)/);
    if(!m||m.length<2)return '';
    var w=parseFloat(m[1]), unit=(m[2]).toLowerCase();
    return 'une portion entre '+this.roundN(w-w*0.07)+unit+' et '+this.roundN(w+w*0.07)+''+unit;    
  }

}

@Pipe({
  name: 'baseprice'
})
export class OrderBasepricePipe implements PipeTransform {
  transform(weight: any, price?: any): any {

    if (!weight ||!price){ 
      return "";
    }
    let portion=weight.split(/(kg|gr|ml)/i);
    let w=(portion[0][0]==='~')?parseFloat(portion[0].substring(1)):parseFloat(portion[0]);
    if(portion.length<2){
      return;
    }
    let unit=(portion[1]).toLowerCase();
    if(unit!=='gr'){
      return;
    }

    // round
    let out=Math.round((100*price/w)*20)/20;
    return out.toFixed(2);
  }
}
