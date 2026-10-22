import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface AdminUser {
  email: string;
  name: string;
}

const KEY = 'raibar-admin-session-v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  /** Currently signed-in owner (null when logged out) */
  user = signal<AdminUser | null>(this.load());
  isLoggedIn = computed(() => this.user() !== null);

  /**
   * DEV MODE prototype login — no real password is stored in frontend code.
   * Accepts any valid email and a password of at least 4 characters.
   * Will be replaced with a real ASP.NET Core API call in Phase 5.
   */
  login(email: string, password: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || password.trim().length < 4) {
      return false;
    }
    const account: AdminUser = { email: cleanEmail, name: 'Owner' };
    this.user.set(account);
    try { sessionStorage.setItem(KEY, JSON.stringify(account)); } catch { /* private mode */ }
    return true;
  }

  logout() {
    this.user.set(null);
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
    this.router.navigateByUrl('/admin/login');
  }

  private load(): AdminUser | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}