import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminShellComponent } from './admin-shell.component';

describe('AdminShellComponent', () => {
  let component: AdminShellComponent;
  let fixture: ComponentFixture<AdminShellComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminShellComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show every sidebar item', () => {
    expect(el.querySelectorAll('nav a, nav .soon').length).toBe(component.nav.length);
  });

  it('should make only ready items clickable links', () => {
    const ready = component.nav.filter(i => i.ready).length;
    expect(el.querySelectorAll('nav a').length).toBe(ready);
  });

  it('should open and close the phone menu', () => {
    const root = el.querySelector('.admin')!;
    component.toggle();
    fixture.detectChanges();
    expect(root.classList).toContain('menu-open');

    component.close();
    fixture.detectChanges();
    expect(root.classList).not.toContain('menu-open');
  });
});