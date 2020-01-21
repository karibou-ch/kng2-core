import { TestBed, inject, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CartService, CartItem } from './cart.service.v2';
import { OrderService } from './order/order.service';
import { ConfigService } from './config.service';
import { Observable } from 'rxjs';

import { shared } from './test-payload/config';
import { CartAction } from './cart.service.v2';
import { User } from './user.service';
import { Product } from './product.service';

describe('CartService', () => {
  let cfg;
  const user = new User();




  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CartService, OrderService, ConfigService,
                  { provide: 'KNG2_OPTIONS', useValue: {API_SERVER: 'test'}}
                ]
    });

    // let store = {};
    // const mockSessionStorage = {
    //   getItem: (key: string): string => key in store ? store[key] : null,
    //   setItem: (key: string, value: string) => store[key] = `${value}`,
    //   removeItem: (key: string) => delete store[key],
    //   clear: () => store = {}
    // };

    // spyOn(Storage.prototype, 'getItem').and.callFake(mockSessionStorage.getItem);
    // spyOn(Storage.prototype, 'setItem').and.callFake(mockSessionStorage.setItem);
    // spyOn(Storage.prototype, 'removeItem').and.callFake(mockSessionStorage.removeItem);
    // spyOn(Storage.prototype, 'clear').and.callFake(mockSessionStorage.clear);

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


  it('items should be empty', inject([CartService], (cart: CartService) => {
    expect(cart).toBeTruthy();
    cart.subscribe(state => {
      if (state.action !== CartAction.CART_LOADED) {
        return;
      }
      const items = cart.getItems();
      expect( cart.quantity()).toEqual(0);
      expect( items.length).toEqual(0);

    });
    cart.setContext(cfg, user);
  }));


  it('items should be not empty-- test localstorage', inject([CartService], (cart: CartService) => {
    expect(cart).toBeTruthy();

    cart.subscribe(state => {
      if (state.action !== CartAction.CART_LOADED) {
        return;
      }
      const item = {
        timestamp: "2019-12-02T14:11:40.032Z",
      title: "Chou rouge lacto-fermenté",
      sku: 1001088,
      thumb: "//ucarecdn.com/96b2905c-8df9-444d-b913-e64292ecdaba/",
      price: 6,
      finalprice: 6,
      category: {slug: "fruits-legumes", name: "Fruits & Légumes"},
      vendor: 
        {urlpath: "une-bonne-sante-bio-fred", 
        name: "Une Bonne Santé/Bio Fred", weekdays: [2, 5]},
      weight: 1,
      discount: false,
      part: "150gr",
      quantity: 1
    };

    const item2= {
      timestamp: "2019-12-02T14:11:40.032Z",
    title: "Tomate",
    sku: 1001088,
    thumb: "//ucarecdn.com/96b2905c-8df9-444d-b913-e64292ecdaba/",
    price: 6,
    finalprice: 6,
    category: {slug: "fruits-legumes", name: "Fruits & Légumes"},
    vendor: 
      {urlpath: "une-bonne-sante-bio-fred", 
      name: "Une Bonne Santé/Bio Fred", weekdays: [2, 5]},
    weight: 1,
    discount: false,
    part: "150gr",
    quantity: 1
  };
      const i = new CartItem(item);
      cart.add(i);
      const items = cart.getItems();
      expect( cart.quantity()).toEqual(1);
      const i2 = new CartItem(item2);
      cart.add(i2);
      console.log('--cart.add server quantity---',cart.quantity() );
      expect( cart.quantity()).toEqual(2);
      cart.remove(i2);
      console.log('--cart.add server quantity--1-',cart.quantity() );
      expect( cart.quantity()).toEqual(1);
    });
    cart.setContext(cfg, user);
  }));



});
