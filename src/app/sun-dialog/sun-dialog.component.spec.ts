import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SunDialogComponent } from './sun-dialog.component';

describe('SunDialogComponent', () => {
  let component: SunDialogComponent;
  let fixture: ComponentFixture<SunDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SunDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SunDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
