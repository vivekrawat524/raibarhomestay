import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SITE } from '../../../core/site.data';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  site = SITE;
  email = '';
  password = '';
  error = signal('');

  submit() {
    this.error.set('');
    if (!this.email.trim() || !this.email.includes('@')) {
      this.error.set('Please enter a valid email address.');
      return;
    }
    if (this.password.trim().length < 4) {
      this.error.set('Please enter your password (at least 4 characters).');
      return;
    }
    if (this.auth.login(this.email, this.password)) {
      this.router.navigateByUrl('/admin/dashboard');
    }
  }
}