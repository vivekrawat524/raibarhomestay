import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TEMPLES } from '../../../core/site.data';
import { AdminDataService } from '../../data/admin-data.service';
import { AdminTrip } from '../../data/admin.models';
import { dayOffset } from '../../data/admin.seed';

@Component({
  selector: 'app-trips',
  imports: [FormsModule],
  templateUrl: './trips.component.html',
  styleUrl: './trips.component.scss'
})
export class TripsComponent {
  data = inject(AdminDataService);
  temples = Object.values(TEMPLES);

  showEditor = signal(false);
  editingId = signal<number | undefined>(undefined);
  feedback = signal<{ text: string; isError: boolean } | null>(null);

  form = {
    title: '',
    days: 2,
    price: 2999,
    img: 'images/p12.jpeg',
    desc: '',
    fixed: {} as Record<string, boolean>,
    optional: {} as Record<string, boolean>,
    active: true
  };

  depInputs: Record<number, { date: string; capacity: number }> = {};

  depFormFor(tripId: number) {
    if (!this.depInputs[tripId]) {
      this.depInputs[tripId] = { date: dayOffset(14), capacity: 8 };
    }
    return this.depInputs[tripId];
  }

  templeName(key: string): string {
    return TEMPLES[key]?.name ?? key;
  }

  openNewTrip() {
    this.editingId.set(undefined);
    this.form = {
      title: '',
      days: 3,
      price: 3499,
      img: 'images/p12.jpeg',
      desc: '',
      fixed: { bh: true, ar: true },
      optional: {},
      active: true
    };
    this.showEditor.set(true);
  }

  openEditTrip(trip: AdminTrip) {
    this.editingId.set(trip.id);
    const fixed: Record<string, boolean> = {};
    const optional: Record<string, boolean> = {};
    trip.fixedTemples.forEach(k => (fixed[k] = true));
    trip.optionalTemples.forEach(k => (optional[k] = true));

    this.form = {
      title: trip.title,
      days: trip.days,
      price: trip.price,
      img: trip.img,
      desc: trip.desc,
      fixed,
      optional,
      active: trip.active
    };
    this.showEditor.set(true);
  }

  saveTrip() {
    if (!this.form.title.trim() || this.form.price <= 0 || this.form.days < 1) {
      this.feedback.set({ text: 'Please enter a valid package title, days, and price.', isError: true });
      return;
    }

    const fixedTemples = Object.keys(this.form.fixed).filter(k => this.form.fixed[k]);
    const optionalTemples = Object.keys(this.form.optional).filter(
      k => this.form.optional[k] && !this.form.fixed[k]
    );

    const saved = this.data.saveTrip({
      id: this.editingId(),
      title: this.form.title.trim(),
      days: Number(this.form.days),
      price: Number(this.form.price),
      img: this.form.img.trim() || 'images/p12.jpeg',
      desc: this.form.desc.trim(),
      fixedTemples,
      optionalTemples,
      active: this.form.active
    });

    this.feedback.set({ text: `${saved.title} saved (₹${saved.price}/person).`, isError: false });
    this.showEditor.set(false);
  }

  toggleActive(trip: AdminTrip) {
    this.data.toggleTripActive(trip.id);
    this.feedback.set({
      text: `${trip.title} is now ${trip.active ? 'hidden' : 'active'}.`,
      isError: false
    });
  }

  addDeparture(tripId: number) {
    const input = this.depFormFor(tripId);
    const res = this.data.addTripDeparture(tripId, input.date, input.capacity);
    this.feedback.set({
      text: res.ok ? 'Departure date added.' : (res.error ?? 'Could not add departure.'),
      isError: !res.ok
    });
  }

  removeDeparture(tripId: number, depId: string) {
    this.data.removeTripDeparture(tripId, depId);
    this.feedback.set({ text: 'Departure date removed.', isError: false });
  }
}