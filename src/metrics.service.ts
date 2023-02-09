import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Config } from './config';
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
      'ngsw-bypass':'true'
    });

    this.config = ConfigService.defaultConfig;
    this.metrics$ = new Subject<Metrics>();
    this.metrics$.pipe(
      debounceTime(500),
      switchMap(metrics => {
      return this.http.post<Metrics>(this.config.API_SERVER + '/v1/matrix', metrics, {
        headers: this.headers,
        withCredentials: true
      })
    })).subscribe();
  }

  push(metrics: Metrics) {    
    this.metrics$.next(metrics);
  }

  get(params?) {

    return this.http.get<any>(this.config.API_SERVER + '/v1/metrics', {
      params:params||{},
      headers: this.headers,
      withCredentials: true
    })
  }
}
