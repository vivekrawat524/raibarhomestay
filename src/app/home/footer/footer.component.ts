import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE, TRIPS } from '../../core/site.data';

@Component({ selector: 'app-footer', standalone: true, imports: [RouterLink], templateUrl: './footer.component.html', styleUrl: './footer.component.scss' })
export class FooterComponent {
  site = SITE; trips = TRIPS;
  links = ['home', 'about', 'rooms', 'gallery', 'trips', 'location', 'reviews', 'contact'];
  year = new Date().getFullYear();
}