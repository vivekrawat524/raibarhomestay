import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { AdminShellComponent } from './layout/admin-shell/admin-shell.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { BookingsComponent } from './features/bookings/bookings.component';
import { RoomsComponent } from './features/rooms/rooms.component';
import { TripsComponent } from './features/trips/trips.component';
import { ContentComponent } from './features/content/content.component';
import { KnowledgeComponent } from './features/knowledge/knowledge.component';
import { PaymentsComponent } from './features/payments/payments.component';
import { SettingsComponent } from './features/settings/settings.component';

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
      { path: 'rooms', component: RoomsComponent },
      { path: 'trips', component: TripsComponent },
      { path: 'content', component: ContentComponent },
      { path: 'knowledge', component: KnowledgeComponent },
      { path: 'payments', component: PaymentsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];
