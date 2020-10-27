import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { LoaderService } from './loader.service';
import { ConfigService } from './config.service';
import { sharedRoot, sharedWithHUB } from './test-payload/config';
import { shops } from './test-payload/shops';
import { UserService } from './user.service';
import { CartService } from './cart.service';
import { ShopService } from './shop.service';
import { CategoryService } from './category.service';

describe('LoaderService', () => {
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


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LoaderService, ConfigService, UserService, CartService, CategoryService, ShopService,
                  { provide: 'KNG2_OPTIONS', useValue: { API_SERVER: 'test'} }]
    });
  });


  it('init loader', inject([LoaderService, HttpTestingController], (loader: LoaderService, httpMock) => {
    expect(loader).toBeTruthy();
    console.log('--- loader initial ready');

    // console.log('---',loader);

    loader.ready().subscribe((loader) => {
      const config = loader[0];
      const user   = loader[1];
      expect(config).toBeDefined();
      expect(config.shared).toBeDefined();
      expect(config.shared.hub.name).toBeUndefined();
      expect(user).toBeDefined();
      console.log('--- DONE');
    });

    httpMock.expectOne(req => {
      expect(req.urlWithParams).toContain('test/v1/config?lang=');
      expect(req.method).toBe('GET');
      return true;
    }).flush(sharedRoot);

    httpMock.expectOne(req => {
      expect(req.urlWithParams).toContain('test/v1/users/me');
      expect(req.method).toBe('GET');
      return true;
    }).flush({}, { status: 401, statusText: 'Vous devez ouvrir une session' });
  }));

  it('init loader waiting for Store ready', inject(
    [LoaderService, ConfigService, ShopService, HttpTestingController],
    ($loader: LoaderService, $config: ConfigService, $shops: ShopService, httpMock) => {
    expect($loader).toBeTruthy();
    console.log('--- $loader waiting for Store ready', sharedWithHUB.hub.name);

    $loader.readyWithStore().subscribe((loader) => {
      const config = loader[0];
      const shops  = loader[2];
      expect(config.shared.hub.name).toBeDefined();
      expect(shops).toBeDefined();
      console.log('--- DONE');
      // done();
    });

    httpMock.expectOne(req => {
      expect(req.urlWithParams).toContain('test/v1/config?lang=');
      expect(req.method).toBe('GET');
      return true;
    }).flush(sharedRoot);


    httpMock.expectOne(req => {
      expect(req.urlWithParams).toContain('test/v1/users/me');
      expect(req.method).toBe('GET');
      return true;
    }).flush({}, { status: 401, statusText: 'Vous devez ouvrir une session' });

    $config.get('artamis').subscribe();
    httpMock.expectOne(req => {
      expect(req.urlWithParams).toContain('test/v1/config?lang=fr&hub=artamis');
      expect(req.method).toBe('GET');
      return true;
    }).flush(sharedWithHUB);

    $shops.query({hub:'artamis'}).subscribe();
    httpMock.expectOne(req => {
      expect(req.urlWithParams).toContain('test/v1/shops');
      expect(req.method).toBe('GET');
      return true;
    }).flush(shops);


  }));

});
