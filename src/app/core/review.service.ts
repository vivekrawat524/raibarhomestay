import { Injectable, computed, inject } from '@angular/core';
import { AdminDataService } from '../admin/data/admin-data.service';
import { Review, SITE } from './site.data';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private adminData = inject(AdminDataService);

  /**
   * Public website ONLY shows reviews that the Admin has accepted ('Approved').
   * New reviews submitted from the website start as 'Pending' in Admin Panel.
   */
  reviews = computed<Review[]>(() =>
    this.adminData
      .reviews()
      .filter(r => r.status === 'Approved')
      .map(r => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        text: r.text,
        date: r.date,
        stay: r.stay
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
  );

  count = computed(() => this.reviews().length);

  average = computed(() =>
    this.count()
      ? this.reviews().reduce((t, r) => t + r.rating, 0) / this.count()
      : 0
  );

  /**
   * Sends the guest review to the Admin Panel with status = 'Pending'.
   * It will NOT appear on the public website until the owner clicks Approve in /admin/content.
   */
  add(r: { name: string; rating: number; text: string; stay: string }) {
    const created = this.adminData.addReview(r);

    if (SITE.reviewEndpoint) {
      fetch(SITE.reviewEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(created)
      }).catch(() => {});
    }
  }
}