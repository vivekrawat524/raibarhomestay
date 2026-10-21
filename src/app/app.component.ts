import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { RevealService } from './core/reveal.service';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { WhatsappFabComponent } from './layout/whatsapp-fab/whatsapp-fab.component';
import { FooterComponent } from './home/footer/footer.component';

@Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet, NavbarComponent, WhatsappFabComponent, FooterComponent], templateUrl: './app.component.html', styleUrl: './app.component.scss' })
export class AppComponent {
  constructor() {
    const reveal = inject(RevealService);
    // after every page change, wait a moment for the page to draw, then set up its scroll animations
    inject(Router).events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => setTimeout(() => reveal.scan(), 80));
  }
}