import { Observable, ReplaySubject } from 'rxjs';


function hasDifferentArgs(prev: unknown[], next: unknown[]) {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    if (!Object.is(prev[i], next[i])) return true;
  }
  return false;
}

//
// cache fonction to avoid useless compute
export function memo<T extends Function>(fnToMemoize: T): T {
  let prevArgs = [{}];
  let result;

  return function (...newArgs) {
    if (hasDifferentArgs(prevArgs, newArgs)) {
      result = fnToMemoize(...newArgs);
      prevArgs = newArgs;
    }
    return result;
  } as any;
}


// FIXME test utility class and replace class by exported functions
export class Utils {

  private static scripts: { [url: string]: ReplaySubject<any> } = {};
  static roundAmount(value) {
    //return parseFloat((Math.round(value * 20) / 20).toFixed(2));
    return parseFloat((Math.round(value * 100) / 100).toFixed(2));
  }

  static mod9710(iban) {
    let remainder = iban;
    let block;
    while (remainder.length > 2) {
        block = remainder.slice(0, 9);
        remainder = parseInt(block, 10) % 97 + remainder.slice(block.length);
    }
    return parseInt(remainder, 10) % 97;
  }
  static mod10(code) {
    code = code.replace(/ /g, "");
    const table = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];
    let carry = 0;
    for (let i = 0; i < code.length; i++) {
        carry = table[(carry + parseInt(code.substr(i, 1), 10)) % 10];
    }
    return ((10 - carry) % 10).toString();
  }
  static deviceID() {
    const navigatorInfo = window.navigator;
    const screenInfo = window.screen;
    let uid = navigatorInfo.mimeTypes.length  + '';
    uid += navigatorInfo.language.split('').map((c, i)=> c.charCodeAt(0)).reduce((p,c)=>p*c);
    uid += (navigatorInfo.productSub || '');
    uid += navigatorInfo.userAgent.replace(/\D+/g, '') + '';
    uid += navigatorInfo.plugins.length;
    uid += screenInfo.height || '';
    uid += screenInfo.width || '';
    uid += screenInfo.pixelDepth || '';
    return uid;
  }

  static encodeQuery(params) {
    const elems = [];
    for (const d in params) {
      elems.push(encodeURIComponent(d) + '=' + encodeURIComponent(params[d]));
    }
    return elems.join('&');
  }

  static isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
  }

  static merge(target, ...sources) {
    if (!sources.length) { return target; }
    const source = sources.shift();

    if (Utils.isObject(target) && Utils.isObject(source)) {
      for (let key in source) {
        if (Utils.isObject(source[key])) {
          if (!target[key]) { Object.assign(target, { [key]: {} }); }
          Utils.merge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return Utils.merge(target, ...sources);
  }


  //
  // https://github.com/ded/script.js/blob/master/dist/script.js
  // https://netbasal.com/loading-external-libraries-on-demand-in-angular-9dad45701801
  static script(url: string, key: string): Observable<string> {
    if (Utils.scripts[url]) {
      return Utils.scripts[url].asObservable();
    }

    Utils.scripts[url] = new ReplaySubject();

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onload = () => {
      const inst = (key && window[key]) || window;
      Utils.scripts[url].next(inst);
      Utils.scripts[url].complete();
    };

    document.body.appendChild(script);

    return Utils.scripts[url].asObservable();
  }
}

//
// useful simple crypto
export class XorCipher {
  constructor() {
  }

  encode(key, data:string) {
    const bytes = this.xor_encrypt(key, data);
    return btoa(bytes.join());
  }

  decode(key, data:string) {
    data = atob(data);
    return this.xor_decrypt(key, data);
  }

  private keyCharAt(key, i) {
    return key.charCodeAt( Math.floor(i % key.length) );
  }

  private xor_encrypt(key, data:string) {
    return data.split('').map((c, i)=> {
      return c.charCodeAt(0) ^ this.keyCharAt(key, i);
    });
  }

  private xor_decrypt(key, data:string) {
    return data.split('').map((c:any, i)=>{
      return String.fromCharCode( c ^ this.keyCharAt(key, i) );
    }).join("");
  }
}


