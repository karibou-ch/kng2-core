import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderWriteComponent } from './order-write.component';

describe('OrderWriteComponent', () => {
  let component: OrderWriteComponent;
  let fixture: ComponentFixture<OrderWriteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrderWriteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderWriteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
