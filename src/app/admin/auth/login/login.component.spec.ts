import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show an error when email is invalid', () => {
    component.email = 'not-an-email';
    component.password = '1234';
    component.submit();
    expect(component.error()).toContain('email');
  });

  it('should sign in and navigate to dashboard with valid input', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    const auth = TestBed.inject(AuthService);

    component.email = 'owner@raibar.com';
    component.password = '1234';
    component.submit();

    expect(auth.isLoggedIn()).toBeTrue();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/dashboard');
  });
});