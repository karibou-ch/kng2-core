import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CartService, CartItem, cartItemsAfterLoad } from './cart.service';
import { CalendarService } from './calendar.service';
import { ConfigService } from './config.service';
import { User, UserAddress } from './user.service';

describe('CartService', () => {
  let cart: CartService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CartService,
        CalendarService,
        ConfigService,
        { provide: 'KNG2_OPTIONS', useValue: { API_SERVER: 'test' } }
      ]
    });
    cart = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('keeps the account address fields when the place matches', () => {
    const account = new User({
      id: 1,
      addresses: [{
        name: 'lucie wild',
        streetAdress: 'rue des bossons 86',
        floor: '8',
        postalCode: '1213',
        region: 'Petit-Lancy',
        phone: '+41763778579',
        note: '8143'
      }]
    });
    spyOn(cart, 'load');
    cart.setContext({
      shared: { hub: { slug: 'geneva', deposits: [] }, shipping: {}, hubs: [{ slug: 'geneva' }] }
    } as any, account);

    const applied = cart.setShippingAddress(UserAddress.from({
      name: 'lucie wild',
      streetAdress: 'rue des bossons 86',
      floor: '8',
      postalCode: '1213',
      phone: '+41765263765',
      when: new Date().toISOString()
    }));

    expect(applied).toBe(true);
    const current = cart.getCurrentShippingAddress();
    expect(current.phone).toBe('+41763778579');
    expect(current.region).toBe('Petit-Lancy');
    expect(current.note).toBe('8143');
  });

  it('stores a usable timestamp on the cart item', () => {
    const item = new CartItem({ sku: 1, timestamp: undefined });
    expect(item.timestamp instanceof Date).toBe(true);
    expect(Number.isFinite(item.timestamp.getTime())).toBe(true);
  });
});

describe('cartItemsAfterLoad', () => {
  const line = (sku, timestamp) => ({ sku, hub: 'geneva', timestamp, frequency: 0 });

  it('keeps a local line when the server cart comes back empty', () => {
    const kept = cartItemsAfterLoad(
      [line(1, new Date())],
      [],
      { geneva: new Date(Date.now() - 60000) }
    );
    expect(kept.map(item => item.sku)).toEqual([1]);
  });

  it('drops a local line already covered by the place-order fence', () => {
    const kept = cartItemsAfterLoad(
      [line(1, new Date(Date.now() - 120000))],
      [],
      { geneva: new Date() }
    );
    expect(kept.length).toBe(0);
  });

  it('uses the server lines when the server still has some', () => {
    const kept = cartItemsAfterLoad(
      [line(1, new Date())],
      [line(2, new Date())],
      {}
    );
    expect(kept.map(item => item.sku)).toEqual([2]);
  });
});
