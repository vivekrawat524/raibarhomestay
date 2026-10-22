import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { RevealService } from './core/reveal.service';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { WhatsappFabComponent } from './layout/whatsapp-fab/whatsapp-fab.component';
import { FooterComponent } from './home/footer/footer.component';

/** true for /admin and /admin/... (but not for something like /administrator) */
const isAdminUrl = (url: string) => /^\/admin(?:[/?#]|$)/.test(url);

@Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet, NavbarComponent, WhatsappFabComponent, FooterComponent], templateUrl: './app.component.html', styleUrl: './app.component.scss' })
export class AppComponent {
  /** on admin pages we hide the customer navbar, footer and WhatsApp button */
  isAdmin = signal(isAdminUrl(window.location.pathname));

  constructor() {
    const reveal = inject(RevealService);
    // after every page change, wait a moment for the page to draw, then set up its scroll animations
    inject(Router).events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(e => {
        const admin = isAdminUrl(e.urlAfterRedirects);
        this.isAdmin.set(admin);
        if (!admin) setTimeout(() => reveal.scan(), 80);   // scroll animations are only for the customer website
      });
  }
}