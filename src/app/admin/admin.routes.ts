import { Routes } from '@angular/router';
import { AdminShellComponent } from './layout/admin-shell/admin-shell.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

/** All admin pages. They load only when someone opens /admin. */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,          // the admin frame (sidebar + top bar)
    children: [                              // pages shown inside the frame
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },   // /admin -> /admin/dashboard
      { path: 'dashboard', component: DashboardComponent },
      { path: '**', redirectTo: 'dashboard' }                     // unknown admin page -> dashboard
    ]
  }
];