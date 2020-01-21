import { TestBed, inject } from '@angular/core/testing';

import { OrderService } from './order.service';
import { HttpClientTestingModule, HttpTestingController  } from '@angular/common/http/testing';
import { ConfigService } from './../config.service';


describe('OrderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderService, ConfigService,
        { provide: 'KNG2_OPTIONS', useValue: {}}]
    });
  });

  it('should ...', inject([OrderService], (service: OrderService) => {
    expect(service).toBeTruthy();
  }));
});
