import { HttpClient,HttpErrorResponse,HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Config, config, configCors } from './config';


import { ReplaySubject ,  Observable ,  throwError as _throw ,  of, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AnalyticsService } from './metrics.service';


export interface Assistant {
    deleted:boolean;
}

//
// Internal cache of request
// simple way to share instance between components
class Cache{
  list: Assistant[];
  map: Map<string, Assistant> //key is a slug
  constructor(){
    this.list=[];
    this.map=new Map();
  }
}

@Injectable()
export class AssistantService {
  //
  // common multicast to update UX when one shop on the list is modified
  // use it for singleton usage of assistant
  public  assistant$: ReplaySubject<Assistant>;
  public  assistants$: BehaviorSubject<Assistant[]> | ReplaySubject<Assistant[]>;

  config: any;


  private cache: Cache = new Cache();
  private headers: HttpHeaders;
  private defaultConfig: Config = config;

  constructor(
    private $http: HttpClient
    ) {
      this.headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Cache-Control' : 'no-cache',
        'Pragma' : 'no-cache',
        'ngsw-bypass':'true',
        'k-dbg': AnalyticsService.FBP
      });
      this.config = config;

    this.assistants$ = new BehaviorSubject<Assistant[]>(null);
  }

  private deleteCache(slug: string): Assistant {
      const incache = this.cache.map.get(slug);
      if (incache) {
          incache.deleted = true;
          this.cache.map.delete(slug);
      }
      return incache;
  }

  private updateCache(assistant: Assistant): Assistant {
    // if(!this.cache.map.get(assistant.slug)){
    //     this.cache.map.set(assistant.slug,(assistant))
    //     return this.cache.map.get(assistant.slug);
    // }
    // return Object.assign(this.cache.map.get(assistant.slug), assistant);
    return assistant;
  }


  history(opts?):Observable<Assistant[]> {
    opts = opts || {};
    const query = new URLSearchParams(opts);

    return this.$http.get<any[]>(this.defaultConfig.API_SERVER + '/v1/assistant/history?'+query.toString(), {
      headers: this.headers,
      withCredentials: (configCors())
    }).pipe(
      tap(assistants => {
        this.assistants$.next(assistants);
        return assistants;
        }),
      catchError((err:HttpErrorResponse) => {
        if(err.status == 401){
          return of([]);
        }
        return throwError(err)
      })
    )
  }


//
// DEPRECATED
//   chatToCart(recipe: string):Observable<CartModel|{}> {
//     return this.$http.post<CartModel>(this.defaultConfig.API_SERVER + '/v1/assistant/recipe',{recipe}, {
//       headers: this.headers,
//       withCredentials: (configCors())
//     }).pipe(
//       catchError((err:HttpErrorResponse) => {
//         if(err.status == 401){
//           return of({});
//         }
//         return throwError(err)
//       })
//     )

//   }

  //
  // REST whisper wrapper
  // whisper(params:any): Observable<string> {

  // }

  //
  // REST api wrapper
  chat(params:any): Observable<any> {
    const options:any = {
      credentials: 'include',
      method:'post',
      cache: "no-cache",
      headers:{
        "Content-Type": "application/json",
        "k-dbg": AnalyticsService.FBP,
        'ngsw-bypass':'true'
      }
    };
    if(configCors()) {
      options.mode = 'cors';
    }
    if(params.body) {
      options.body=JSON.stringify(params.body)
      delete params.body;
    }

    //
    // force no-cache
    params.rnd = Date.now();
    const query = new URLSearchParams(params || {});

    return new Observable<any>(observer => {
      const xhr = new XMLHttpRequest();
      try{
        xhr.open('POST', this.defaultConfig.API_SERVER + '/v1/assistant/thread?'+query.toString(),true);
        //
        // remove it for no CORS
        if(configCors()) {
          xhr.withCredentials = true;
        }
        xhr.setRequestHeader('ngsw-bypass','true');
        xhr.setRequestHeader("k-dbg", AnalyticsService.FBP);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'text/event-stream');
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        // we must make use of this on the server side if we're working with Android - because they don't trigger
        // readychange until the server connection is closed
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        //
        // decode json data
        // => /(${anchor}:)[^{]*(.*?\})/gi
        const anchor = params.anchor || 'zqyw';
        const jsonEx = new RegExp(`(${anchor}:)(.*)`,"gim");
        //const skuBlock = /{{(.*?)}}/ig;
        const skuBlock = /{{([\d,]*?)}}|\[([\d,]*?)\]/ig;
        let responseText = '';
        let fullcontent = '';

        let lastIndex = 0;
        xhr.onprogress = () => {
          const index = xhr.responseText.length;
          if (lastIndex == index){
            return;
          }


          responseText = xhr.responseText;
          const text =  responseText.substring(lastIndex).replace(skuBlock,'');
          const json = jsonEx.exec(text);
          let tool = {};
          if(json && json[2]) {
            try{ tool = JSON.parse(`${json[2]}`); }catch(err) {}
          }

          lastIndex = index;
          fullcontent+=text;
          observer.next({text:text.replace(jsonEx,''),tool}); // Envoyer le chunk au subscriber
        };

        xhr.onload = () => {
          // xhr.responseText;
          const skus = responseText.match(skuBlock);
          let tool = {};

          //
          // our template content
          if(skus && skus.length) {
            tool = skus.map(match => match.replace(/{{|}}/g, '').split(',')).flat().map(sku => (+sku)).filter(sku => sku);
          }
          //observer.next({text:fullcontent,tool});
          observer.complete();
        };

        xhr.onerror = function() {
          observer.error(new TypeError('Network request error'));
          observer.complete();
        }
        xhr.ontimeout = function() {
          observer.error(new TypeError('Network request timed out'));
          observer.complete();
        }

        xhr.send(options.body);

      }catch(err) {
        console.log('---- err',err);
        observer.error(err);
        observer.complete();
      }

      return {
        abort() {
          xhr.abort();
        },
        unsubscribe() {
        }
      };
    });
  }


  message(content:string, subject?:string, audioContext?: {audioUrl?: string, transcription?: string, cartUrl?: string}): Observable<any> {
    const payload: any = {content, subject};
    if (audioContext) {
      Object.assign(payload, audioContext);
    }
    return this.$http.post<any>(this.defaultConfig.API_SERVER + '/v1/assistant/message', payload, {
      headers: this.headers,
      withCredentials: (configCors())
    })
  }
}
