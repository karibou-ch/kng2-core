import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Config } from './config';
import { ConfigService } from './config.service';


import { ReplaySubject } from 'rxjs';

export interface Metrics {
  when: string;
  ip: string;
  hub: string;
  action: string;
  hit: number;
  amount: number;
  source: string;
  updated: Date;
}

@Injectable()
export class MetricsService {

  private headers: HttpHeaders;
  public config: Config | any;
  public metrics$: ReplaySubject<Metrics>;

  constructor(
    private http: HttpClient
  ) {
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.metrics$ = new ReplaySubject<Metrics>(1);
    this.config = ConfigService.defaultConfig;
  }

  push(metrics: Metrics) {    
    return this.http.post<Metrics>(this.config.API_SERVER + '/v1/metrics' + hub.slug, hub, {
      headers: this.headers,
      params: (metrics as any),
      withCredentials: true
  });
  }

}
