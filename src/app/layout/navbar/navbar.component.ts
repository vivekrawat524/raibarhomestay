import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { LangService } from '../../core/lang.service';
import { SITE } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({
  selector: 'app-navbar', standalone: true, imports: [RouterLink, LangSwitchComponent],
  templateUrl: './navbar.component.html', styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  l = inject(LangService);
  site = SITE;
  scrolled = signal(false);
  onHome = signal(true);
  menuOpen = signal(false);
  progress = signal(0);
  /** compact (small, solid) once you scroll, and always on inner pages */
  compact = computed(() => this.scrolled() || !this.onHome());

  constructor() {
    inject(Router).events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(e => this.onHome.set(e.urlAfterRedirects.split(/[?#]/)[0] === '/'));
  }

  @HostListener('window:scroll')
  onScroll() {
    const h = document.documentElement;
    this.scrolled.set(window.scrollY > 40);
    this.progress.set((h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100);
  }
  toggle() { this.menuOpen.update(v => !v); }
  close() { this.menuOpen.set(false); }
}