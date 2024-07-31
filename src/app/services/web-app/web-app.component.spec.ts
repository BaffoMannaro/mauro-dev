import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebAppComponent } from './web-app.component';

describe('WebAppComponent', () => {
  let component: WebAppComponent;
  let fixture: ComponentFixture<WebAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebAppComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
