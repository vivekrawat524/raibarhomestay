import { Component } from '@angular/core';
import { HeroComponent } from './hero/hero.component';
import { AboutComponent } from './about/about.component';
import { RoomsComponent } from './rooms/rooms.component';
import { GalleryComponent } from './gallery/gallery.component';
import { TripsComponent } from './trips/trips.component';
import { LocationComponent } from './location/location.component';
import { ReviewsComponent } from './reviews/reviews.component';
import { ContactComponent } from './contact/contact.component';

@Component({
  selector: 'app-home', standalone: true,
  imports: [HeroComponent, AboutComponent, RoomsComponent, GalleryComponent, TripsComponent, LocationComponent, ReviewsComponent, ContactComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {}