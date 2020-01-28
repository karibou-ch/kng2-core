import { TestBed, inject, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CartService, CartItem } from './cart.service';

import { OrderService } from './order/order.service';
import { ConfigService } from './config.service';
import { Observable } from 'rxjs';

import { shared } from './test-payload/config';
import { items } from './test-payload/items';
import { CartAction } from './cart.service.v2';
import { User } from './user.service';
import { Product } from './product.service';

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
    name:"Nathalie Chabert",
    updated: Date.now(),
    items:[],
    cid:["85845062-01a1-58a2-8b99-2b9bedd8e522"]
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
//    console.log("Trying to wait after the test");
    setTimeout(() => { }, 1000);
  }));

  it('load config shared', inject([ConfigService, HttpTestingController], (config: ConfigService, httpMock) => {
    // expect(config).toBeTruthy();
    config.get().subscribe((c) => {
      cfg = c;
    });
    const req = httpMock.expectOne('test/v1/config?lang=en-US');
    expect(req.request.method).toBe('GET');
    req.flush(shared);
  }));

//
//
// test CartService items should be empty
  it('items should be empty', inject([CartService, HttpTestingController], (cart: CartService, httpMock) => {
    expect(cart).toBeTruthy();
    cart.subscribe(state => {
      expect(state.action).toEqual(5);
      cart.getCurrentShippingDay();
      console.log('getCurrentShippingDay -- 1 ',cart.getCurrentShippingDay());
      const items = cart.getItems();
      expect( cart.quantity()).toEqual(0);
      expect( items.length).toEqual(0);
      console.log('-- DEBUG end');

    });
    cart.setContext(cfg, user);
    cart.getCurrentShippingDay();
    console.log('getCurrentShippingDay -- 2 ',cart.getCurrentShippingDay());
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
  // it('items should be stored on localstorage', inject([CartService, HttpTestingController], (cart: CartService, httpMock) => {
  //   expect(cart).toBeTruthy();


  //   cart.subscribe(state => {
  //     expect(state.action).toEqual(5);
  //     cart.add(new CartItem(items[0]));
  //     expect( cart.quantity()).toEqual(1);
  //     console.log('httpMock ',httpMock);
  //     postError(httpMock, 400);
  //     cart.add(new CartItem(items[1]));
  //     expect( cart.quantity()).toEqual(2);
  //     httpMock.expectOne('test/v1/cart').error(new Error('POOUET'));
  //     cart.remove(new CartItem(items[0]));
  //     expect( cart.quantity()).toEqual(1);
  //     postError(httpMock, 400);

  //     expect(store['kng2-cart']).toBeDefined();

  //     console.log('-- DEBUG end');

  //   });
  //   cart.setContext(cfg, user);
  //   //httpMock.expectOne('test/v1/cart').error(new Error('POOUET'));

  // }));


  //
  //
  // Test 
  // it('items should be loaded from localStorage', inject([CartService, HttpTestingController], (cart: CartService, httpMock) => {
  //   expect(cart).toBeTruthy();

  //   cart.subscribe(state => {
  //     expect(state.action).toEqual(5);

  //     expect( cart.quantity()).toEqual(1);
  //     console.log('-- DEBUG end');
  //   });
  //   cart.setContext(cfg, user);
  //   httpMock.expectOne('test/v1/cart').error(new Error('POOUET'));
  // }));

//
//
// test
  // it('items should be stored on serveur', inject([CartService, HttpTestingController], (cart: CartService, httpMock) => {
  //   expect(cart).toBeTruthy();


  //   cart.subscribe(state => {
  //     if (state.action !== CartAction.CART_LOADED) {
  //       return;
  //     }
  //     store = {};
  //     cart.add(new CartItem(items[0]));
  //     const result0 = Object.assign({}, simpleResult);
  //     result0.items = [items[0]];
  //     postSuccess(httpMock, result0);
  //     expect( cart.quantity()).toEqual(1);
  //     expect( cart.getItems()[0].sku).toEqual(items[0].sku);

  //     cart.add(new CartItem(items[1]));
  //     const result1 = Object.assign({}, simpleResult);
  //     result1.items = [items[0],items[1]];
  //     postSuccess(httpMock, result1);
  //     expect( cart.quantity()).toEqual(2);

  //     // cart.remove(new CartItem(items[0]));
  //     // expect( cart.quantity()).toEqual(1);
  //     // postError(httpMock, 400);

  //     expect(store['kng2-cart']).toBeUndefined();


  //   });
  //   cart.setContext(cfg, user);
  //   cart.load();

  // }));











});
