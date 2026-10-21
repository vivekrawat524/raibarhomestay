import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsappFabComponent } from './whatsapp-fab.component';

describe('WhatsappFabComponent', () => {
  let component: WhatsappFabComponent;
  let fixture: ComponentFixture<WhatsappFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsappFabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatsappFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
