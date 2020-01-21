import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from '../util';

@Pipe({
  name: 'portion'
})
export class OrderPortionPipe implements PipeTransform {

  public roundN(val: number) {
    if (val <= 5) {
      return val.toFixed(1);
    }
    if (val <= 50) {
      return Math.round(val);
    }
    const N = 5;
    return (Math.round(val / N) * N);
  }

  public transform(weight: any, def?: any): any {
    if (!def) {def = ''; }
    if (!weight) { return ''; }
    let m = weight.match(/~([0-9.]+) ?(.+)/);
    if (!m && def) {m = def.match(/~([0-9.]+) ?(.+)/); }
    if (!m || m.length < 2) {return ''; }
    const w = parseFloat(m[1]), unit = (m[2]).toLowerCase();
    return 'une portion entre ' + this.roundN(w - w * 0.07) + unit + ' et ' + this.roundN(w + w * 0.07) + '' + unit;
  }

}

@Pipe({
  name: 'baseprice'
})
export class OrderBasepricePipe implements PipeTransform {
  public transform(weight: any, price?: any): any {

    if (!weight || !price) {
      return '';
    }
    const portion = weight.split(/(kg|gr|ml)/i);
    const w = (portion[0][0] === '~') ? parseFloat(portion[0].substring(1)) : parseFloat(portion[0]);
    if (portion.length < 2) {
      return;
    }
    const unit = (portion[1]).toLowerCase();
    if (unit !== 'gr') {
      return;
    }

    return Utils.roundAmount((100 * price / w));
  }
}
