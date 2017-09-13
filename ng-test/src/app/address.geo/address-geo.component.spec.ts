import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressGeoComponent } from './address-geo.component';

describe('AddressGeoComponent', () => {
  let component: AddressGeoComponent;
  let fixture: ComponentFixture<AddressGeoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddressGeoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddressGeoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
