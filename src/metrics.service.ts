import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Config, configCors, config } from './config';
import { ConfigService } from './config.service';


import { Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

export interface Metrics {
  when?: string;
  ip?: string;
  hit?: number;
  updated?: Date;
  amount?: number;
  hub: string;
  action: string;
  source: string;
  extra?:any;
}

@Injectable()
export class AnalyticsService {

  //
  // use MARKER default or previous available on localStorage
  static FBP = "fb.1."+Date.now()+"."+(Math.random()*1000000000|0);
  private headers: HttpHeaders;
  public config: Config | any;
  public metrics$: Subject<Metrics>;

  constructor(
    private http: HttpClient
  ) {
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control' : 'no-cache',
      'Pragma' : 'no-cache',
      'ngsw-bypass':'true',
      'k-dbg': AnalyticsService.FBP
    });


    //
    // build a custom pixel marker for Meta (FB)
    try {
      AnalyticsService.FBP = localStorage.getItem('meta-fbp') || AnalyticsService.FBP;
      localStorage.setItem('meta-fbp',(AnalyticsService.FBP));
    } catch (err) {
    }



    this.config = config;
    this.metrics$ = new Subject<Metrics>();
    this.metrics$.pipe(
      debounceTime(500),
      switchMap(metrics => {
      return this.http.post<Metrics>(this.config.API_SERVER + '/v1/matrix', metrics, {
        headers: this.headers,
        withCredentials: (configCors())
      })
    })).subscribe();
  }

  push(metrics: Metrics) {    
    this.metrics$.next(metrics);
  }

  feedback(evaluation, content) {    
    return this.http.post<any>(this.config.API_SERVER + '/v1/metrics/feedback',{evaluation,content}, {
      headers: this.headers,
      withCredentials: (configCors())
    })

  }

  get(params?) {
    return this.http.get<any>(this.config.API_SERVER + '/v1/metrics', {
      params:params||{},
      headers: this.headers,
      withCredentials: (configCors())
    })
  }
}
