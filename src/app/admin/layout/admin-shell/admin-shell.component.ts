import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SITE } from '../../../core/site.data';

/** One item in the admin sidebar. ready = false means "built in a later task" */
interface NavItem { label: string; icon: string; path: string; ready: boolean }

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss'
})
export class AdminShellComponent {
  site = SITE;

  /** on phones the sidebar is hidden until the ☰ button is pressed */
  menuOpen = signal(false);

  nav: NavItem[] = [
    { label: 'Dashboard', icon: '📊', path: 'dashboard', ready: true },
    { label: 'Bookings',  icon: '📅', path: 'bookings',  ready: false },
    { label: 'Rooms',     icon: '🛏️', path: 'rooms',     ready: false },
    { label: 'Trips',     icon: '🏔️', path: 'trips',     ready: false },
    { label: 'Website',   icon: '🖼️', path: 'content',   ready: false },
    { label: 'Payments',  icon: '💳', path: 'payments',  ready: false },
    { label: 'Settings',  icon: '⚙️', path: 'settings',  ready: false }
  ];

  toggle() { this.menuOpen.update(open => !open); }
  close() { this.menuOpen.set(false); }
}