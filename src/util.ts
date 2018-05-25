import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

  // TODO test utility class
export class Utils{
  static roundAmount(value) {
    return parseFloat((Math.round(value * 20) / 20).toFixed(2));
  }

  static encodeQuery(params) {
    let elems = [];
    for (let d in params)
      elems.push(encodeURIComponent(d) + '=' + encodeURIComponent(params[d]));
    return elems.join('&');
  }  
  
  static isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
  }

  static merge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
  
    if (Utils.isObject(target) && Utils.isObject(source)) {
      for (const key in source) {
        if (Utils.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          Utils.merge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  
    return Utils.merge(target, ...sources);
  }  


  //
  //https://github.com/ded/script.js/blob/master/dist/script.js
  static script(path:string,key:string):Observable<string>{
    if(Utils.scripts[key]){
      return of(key);
    }
    
    let head = document.getElementsByTagName('head')[0];
    let script = document.createElement('script');
    let obs=Observable.create(observer=>{
      script.onload = script.onerror = script['onreadystatechange']=()=>{
        Utils.scripts[key]=true;
        observer.next(key);
        observer.complete();
      }        
    });
    script.async =true;
    script.src = path;
    head.insertBefore(script, head.lastChild);
    return obs;
  }

  private static scripts:{[key:string]:boolean}={};  
}

//
// useful simple crypto
export class XorCipher{
  constructor(){
  }

  // static encode(key, data:string) {
  //   data = this.xor_encrypt(key, data);
  //   return btoa(data);
  // }

  // static decode(key, data:string) {
  //   data = atob(data);
  //   return this.xor_decrypt(key, data);
  // }

  // private static keyCharAt(key, i) {
  //   return key.charCodeAt( Math.floor(i % key.length) );
  // }

  // private static xor_encrypt(key, data:string) {
  //   return data.split('').map((c, i)=> {
  //     return c.charCodeAt(0) ^ this.keyCharAt(key, i);
  //   });
  // }

  // private static xor_decrypt(key, data:string) {
  //   return data.split('').map((c, i)=>{
  //     return String.fromCharCode( c ^ this.keyCharAt(key, i) );
  //   }).join("");
  // }    
} 


