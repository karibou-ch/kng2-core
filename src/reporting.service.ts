import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';

import { Config, config, ConfigKeyStoreEnum } from './config';
import { UserAddress, DepositAddress } from './user.service';

import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { map, tap } from 'rxjs/operators';

export class ReportCustomer {
  public _id: string;
  public last1Month: number;
  public last3Month: number;
  public last6Month: number;
  public after6Month: number;
  public amount: number;
  public orders: number;
}

export class ReportOrders {

  constructor(json: any) {
    const defaultReport = {
    };

    Object.assign(this, json || {});
  }

  public shops: {
    [slug: string]: {
      name: string;
      vendor: string;
      orders: number[];
      items: number;
      amount: number;
      discount: number;
      fees: number;
      contractFees: number[];
      errors?: number;
      refunds?: number;
    };
  };

  public products: [{
    sku: number;
    title: string;
    count: number;
    amount: number;
    vendor: string;
  }];

  public from: Date;
  public to: Date;
  public ca: number;
  public discount: number;
  public amount: number;
  public items: number;
  public orders: number[];
}

@Injectable()
export class ReportingService {

  private config: any;
  private headers: HttpHeaders;
  public report: Observable<ReportOrders>;

  constructor(
    private http: HttpClient
  ) {
    this.headers = new HttpHeaders();
    this.headers.append('Content-Type', 'application/json');
    this.config = config;
  }

  //
  // config.API_SERVER+'/v1/orders/invoices/shops/6/2018'
  public getReport(year: number, month?: number|string, shops?: any): Observable<ReportOrders> {
    month = month || '-';
    const params: any = {};
    if (shops) {
      params.shops = shops;
    }
    return this.config = this.http.get<ReportOrders>(config.API_SERVER + '/v1/orders/invoices/shops/' + month + '/' + year, {
      params,
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map((json) => new ReportOrders(json))
    );
  }

  public getCustomers(): Observable<ReportCustomer[]> {
    return this.config = this.http.get<ReportCustomer[]>(config.API_SERVER + '/v1/stats/customers', {
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map((json) => json)
    );
  }

}
