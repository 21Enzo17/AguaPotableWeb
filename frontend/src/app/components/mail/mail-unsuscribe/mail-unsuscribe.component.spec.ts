import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MailUnsuscribeComponent } from './mail-unsuscribe.component';

describe('MailUnsuscribeComponent', () => {
  let component: MailUnsuscribeComponent;
  let fixture: ComponentFixture<MailUnsuscribeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MailUnsuscribeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MailUnsuscribeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
