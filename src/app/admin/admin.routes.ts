import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { AdminShellComponent } from './layout/admin-shell/admin-shell.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { BookingsComponent } from './features/bookings/bookings.component';

/** All admin pages. They load only when someone opens /admin. */
export const ADMIN_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },  // public login screen (no sidebar)
  {
    path: '',
    component: AdminShellComponent,              // the admin frame (sidebar + top bar)
    canActivate: [authGuard],                    // blocks access unless logged in
    children: [                                  // pages shown inside the frame
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'bookings', component: BookingsComponent },
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];