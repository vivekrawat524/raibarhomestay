import { Injectable, computed, signal } from '@angular/core';
import { REVIEWS, Review, SITE } from './site.data';

const KEY = 'raibar-reviews-v1';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  /** reviews written in this browser */
  private local = signal<Review[]>(this.load());

  /** approved reviews (site.data.ts) + the ones written on this device, newest first */
  reviews = computed(() => [...this.local(), ...REVIEWS].sort((a, b) => b.date.localeCompare(a.date)));
  count = computed(() => this.reviews().length);
  average = computed(() => this.count() ? this.reviews().reduce((t, r) => t + r.rating, 0) / this.count() : 0);

  add(r: { name: string; rating: number; text: string; stay: string }) {
    const review: Review = { ...r, id: 'u' + Date.now(), date: new Date().toISOString().slice(0, 10), mine: true };
    this.local.update(list => [review, ...list]);
    try { localStorage.setItem(KEY, JSON.stringify(this.local())); } catch { /* private mode etc. */ }
    // Optional: email the review to the owner (Formspree, EmailJS...). Set SITE.reviewEndpoint to turn this on.
    if (SITE.reviewEndpoint) {
      fetch(SITE.reviewEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(review)
      }).catch(() => {});
    }
  }

  private load(): Review[] {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
  }
}