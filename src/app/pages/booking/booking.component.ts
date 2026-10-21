import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LangService } from '../../core/lang.service';
import { ROOMS, SITE } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-booking', standalone: true, imports: [FormsModule, RouterLink, LangSwitchComponent], templateUrl: './booking.component.html', styleUrl: './booking.component.scss' })
export class BookingComponent {
  l = inject(LangService);
  rooms = ROOMS;
  site = SITE;
  selected = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('room') ?? 0);
  f = { checkIn: '', checkOut: '', guests: '2 Guests', name: '', email: '', phone: '', note: '' };
  today = new Date().toISOString().slice(0, 10);
  sent = false;
  error = '';

  get room() { return this.rooms[this.selected]; }
  get nights() {
    if (!this.f.checkIn || !this.f.checkOut) return 0;
    return Math.max(0, Math.round((+new Date(this.f.checkOut) - +new Date(this.f.checkIn)) / 864e5));
  }
  get total() { return this.nights * this.room.price; }

  submit() {
    if (!this.f.checkIn || !this.f.checkOut || this.nights < 1) { this.error = 'Please choose valid check-in and check-out dates.'; return; }
    if (!this.f.name || !this.f.phone) { this.error = 'Please enter your name and phone number.'; return; }
    this.error = '';
    // TODO: replace with a real API call, e.g. this.http.post('/api/bookings', {...this.f, room: this.room.name})
    const msg = `Booking enquiry%0ARoom: ${this.room.name}%0ADates: ${this.f.checkIn} to ${this.f.checkOut} (${this.nights} nights)%0AGuests: ${this.f.guests}%0AName: ${this.f.name}%0APhone: ${this.f.phone}%0ANote: ${this.f.note}`;
    window.open(`https://wa.me/${this.site.whatsapp}?text=${msg}`, '_blank');
    this.sent = true;
  }
}