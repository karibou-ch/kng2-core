import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { UserService } from './user.service';

describe('UserService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService,
                  { provide: 'KNG2_OPTIONS', useValue: {API_SERVER: 'test'}}]
    });
  });

  it('should init', inject([UserService, HttpTestingController], (service: UserService, httpMock) => {

    expect(service).toBeTruthy();
    service.get(1).subscribe((user) => {
      expect(user.id).toEqual(1);
      user.display();
    });
    const req = httpMock.expectOne('test/v1/users/1');
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 1
    });
  }));
});
