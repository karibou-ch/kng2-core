import { TestBed, inject, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CartService, CartItem } from './cart.service';

import { OrderService } from './order/order.service';
import { ConfigService } from './config.service';

import { sharedRoot } from './test-payload/config';
import { items } from './test-payload/items';
import { User } from './user.service';

describe('CartService : localStorage', () => {
  let cfg;
  const user = new User({
    id: 1,
    name: {
      givenName: 'Hello', familyName : 'World'
    },
    tags: []
  });
  let store = {};
  const postError = (httpMock, status) => {
      //
      // define defaul error when posting cart on server
      const req = httpMock.expectOne('test/v1/cart');
      expect(req.request.method).toBe('POST');
      req.flush({}, { status: (status), statusText: 'Bad Request' });
  };

  const postSuccess = (httpMock, value) => {
    const req = httpMock.expectOne('test/v1/cart');
    expect(req.request.method).toBe('POST');
    req.flush(value);
  };

  const simpleResult = {
    name: 'Nathalie Chabert',
    updated: Date.now(),
    items: [],
    cid: ['85845062-01a1-58a2-8b99-2b9bedd8e522']
  };



  beforeEach(() => {
    user.id = 1;
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CartService, OrderService, ConfigService,
                  { provide: 'KNG2_OPTIONS', useValue: {API_SERVER: 'test'}}
                ]
    });

    const mockSessionStorage = {
      getItem: (key: string): string => key in store ? store[key] : null,
      setItem: (key: string, value: string) => store[key] = `${value}`,
      removeItem: (key: string) => delete store[key],
      clear: () => store = {}
    };

    spyOn(Storage.prototype, 'getItem').and.callFake(mockSessionStorage.getItem);
    spyOn(Storage.prototype, 'setItem').and.callFake(mockSessionStorage.setItem);
    spyOn(Storage.prototype, 'removeItem').and.callFake(mockSessionStorage.removeItem);
    spyOn(Storage.prototype, 'clear').and.callFake(mockSessionStorage.clear);

  });

  afterEach(async(() => {
    setTimeout(() => { }, 100);
  }));

  xit('load config shared', inject([ConfigService, HttpTestingController], (config: ConfigService, httpMock) => {
    // expect(config).toBeTruthy();
    config.get().subscribe((c) => {
      cfg = c;
    });
    const req = httpMock.expectOne('test/v1/config?lang=en-US');
    expect(req.request.method).toBe('GET');
    req.flush(sharedRoot);
  }));

//
//
// test CartService items should be empty
  xit('items should be empty', inject([CartService, HttpTestingController], (cart: CartService, httpMock) => {
    expect(cart).toBeTruthy();
    cart.subscribe(state => {
      expect(state.action).toEqual(5);
      cart.getCurrentShippingDay();
      const items = cart.getItems();
      expect( cart.quantity()).toEqual(0);
      expect( items.length).toEqual(0);
    });
    cart.setContext(cfg, user);
    cart.getCurrentShippingDay();
    httpMock.expectOne(req => {
      expect( req.urlWithParams).toContain('test/v1/cart?cart=');
      expect( req.urlWithParams).toContain('items');
      expect( req.urlWithParams).toContain('updated');
      return true;
    }).error(new Error('POOUET'));

  }));

//
//
// Test
  xit('items should be stored on localstorage', inject([CartService, HttpTestingController], (cart: CartService, httpMock) => {
    expect(cart).toBeTruthy();

    cart.subscribe(state => {

      if (state.action !== 5) {
          return;
      }
      expect(state.action).toEqual(5);
      cart.getCurrentShippingDay();

      cart.add(new CartItem(items[0]));
      expect( cart.quantity()).toEqual(1);
      postError(httpMock, 400);

      cart.add(new CartItem(items[1]));
      httpMock.expectOne('test/v1/cart').error(new Error('POOUET')); // server error, (URL doesn't exist, server down...)
      expect( cart.quantity()).toEqual(2);

      cart.remove(new CartItem(items[0]));
      postError(httpMock, 400); // service error
      expect( cart.quantity()).toEqual(1);

      expect(store['kng2-cart']).toBeDefined();


    });
    cart.setContext(cfg, user);
    cart.getCurrentShippingDay();
    httpMock.expectOne(req => {
      expect( req.urlWithParams).toContain('test/v1/cart?cart=');
      expect( req.urlWithParams).toContain('items');
      expect( req.urlWithParams).toContain('updated');
      return true;
    }).error(new Error('POOUET'));
  }));

  //
  //
  // Test
  xit('items should be loaded from localStorage', inject([CartService, HttpTestingController], (cart: CartService, httpMock) => {
    expect(cart).toBeTruthy();

    cart.subscribe(state => {
      expect(state.action).toEqual(5);
      expect( cart.quantity()).toEqual(1);
    });
    cart.setContext(cfg, user);
    cart.getCurrentShippingDay();
    httpMock.expectOne(req => {
      expect( req.urlWithParams).toContain('test/v1/cart?cart=');
      expect( req.urlWithParams).toContain('items');
      expect( req.urlWithParams).toContain('updated');
      return true;
    }).error(new Error('POOUET'));
  }));


});
