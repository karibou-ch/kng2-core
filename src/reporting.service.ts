import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { config } from './config';


import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export class ReportCustomer {
  // tslint:disable-next-line: variable-name
  _id: string;
  last1Month: number;
  last3Month: number;
  last6Month: number;
  after6Month: number;
  amount: number;
  orders: number;
  errors?: number;
  refunds?: number;
}

export interface ReportOrderIssue {
  oid: number;
  title: string;
  sku: number;
  quantity: number;
  issue: string;
  email: string;
}

export class ReportIssues {
  amount: number;
  // tslint:disable-next-line: variable-name
  _id: {
    vendor: string;
    month: number;
    year: number;
  };

  orders: {
    total: number;
    amount: number;
  };
  issues: ReportOrderIssue[];
  ratio?: number;
}

export class ReportShopper {

  constructor(json: any) {
    Object.assign(this, json || {});
    this.orders.forEach(order => {
      order.when = new Date(order.when);
    });
    this.from = new Date(this.from);
    this.to = new Date(this.to);
  }

  orders: {
    when: Date;
    who: string;
    slot: string;
    bags: number;
    name: string;
    postalCode: string;
    streetAdress: string;
    amount: number;  
  }[];

  shoppers: {
    who : string;
    ca: number;
    extra: number;
  }[];

  from: Date;
  to: Date;
  who?:string;
}

export class ReportOrders {

  constructor(json: any) {
    const defaultReport = {
    };

    Object.assign(this, json || {});
  }

  shops: {
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

  products: [{
    sku: number;
    title: string;
    count: number;
    amount: number;
    vendor: string;
  }];

  from: Date;
  to: Date;
  ca: number;
  discount: number;
  amount: number;
  items: number;
  orders: number[];
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
  getReport(year: number, month?: number|string, shops?: any): Observable<ReportOrders> {
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
      map(json => new ReportOrders(json))
    );
  }

  //
  // config.API_SERVER+'/v1/orders/invoices/shopper/6/2018'
  getReportShopper(year: number, month?: number|string, owner?: string): Observable<ReportShopper> {
    month = month || '-';
    const params: any = {};
    if (owner) {
      params.owner = owner;
    }
    return this.config = this.http.get<ReportOrders>(config.API_SERVER + '/v1/orders/invoices/shopper/' + month + '/' + year, {
      params,
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map(json => new ReportShopper(json))
    );
  }  


  getCustomers(): Observable<ReportCustomer[]> {
    return this.config = this.http.get<ReportCustomer[]>(config.API_SERVER + '/v1/stats/customers', {
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map(json => json)
    );
  }


  getIssues(year?, month?): Observable<ReportIssues[]> {
    year = year || '';
    month = month || '-';
    return this.config = this.http.get<ReportIssues[]>(config.API_SERVER + '/v1/stats/orders/issues/'  + month + '/' + year, {
      headers: this.headers,
      withCredentials: true,
    }).pipe(
      map(json => json)
    );
  }
}
