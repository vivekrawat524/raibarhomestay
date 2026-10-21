import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { BookingComponent } from './pages/booking/booking.component';
import { TripDetailComponent } from './pages/trip-detail/trip-detail.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'book', component: BookingComponent },
  { path: 'trip/:id', component: TripDetailComponent },
  { path: '**', redirectTo: '' }
];