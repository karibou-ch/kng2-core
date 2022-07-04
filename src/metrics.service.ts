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
}

@Injectable()
export class AnalyticsService {

  private headers: HttpHeaders;
  public config: Config | any;
  public metrics$: Subject<Metrics>;

  constructor(
    private http: HttpClient
  ) {
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.config = ConfigService.defaultConfig;
    this.metrics$ = new Subject<Metrics>();
    this.metrics$.pipe(
      debounceTime(2000),
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

  get() {
    return this.http.get<any>(this.config.API_SERVER + '/v1/metrics', {
      headers: this.headers,
      withCredentials: true
    })
  }
}
