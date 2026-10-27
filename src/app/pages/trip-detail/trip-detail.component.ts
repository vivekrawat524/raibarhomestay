import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../admin/data/admin-data.service';
import { LangService } from '../../core/lang.service';
import { SITE, TEMPLES, TRIPS, templeCount } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-trip-detail', standalone: true, imports: [FormsModule, RouterLink, LangSwitchComponent], templateUrl: './trip-detail.component.html', styleUrl: './trip-detail.component.scss' })
export class TripDetailComponent {
  l = inject(LangService);
  private adminData = inject(AdminDataService);
  site = SITE;
  temples = TEMPLES;
  trip = TRIPS.find(t => t.id === Number(inject(ActivatedRoute).snapshot.paramMap.get('id')));
  count = this.trip ? templeCount(this.trip) : 0;
  /** which optional temples are ticked: { de: true, bi: false } */
  picked: Record<string, boolean> = {};
  f = { date: '', travellers: 2, name: '', phone: '' };
  sent = false;

  constructor() { if (!this.trip) inject(Router).navigateByUrl('/'); }

  get chosen() { return this.trip?.options.filter(k => this.picked[k]) ?? []; }
  get total() { return (this.trip?.price ?? 0) * this.f.travellers; }

  submit() {
    if (!this.f.name || !this.f.phone || !this.f.date) return;
    const opts = this.chosen.map(k => TEMPLES[k].name).join(', ') || 'None';

    // Save into AdminDataService so it shows on the Admin Trip Booking Calendar
    this.adminData.addTripBooking({
      guestName: this.f.name,
      phone: this.f.phone,
      travellers: Number(this.f.travellers) || 2,
      tripId: this.trip!.id,
      startDate: this.f.date,
      optionalTemples: opts,
      status: 'Pending',
      paymentStatus: 'Unpaid'
    });

    this.sent = true;
  }
}