import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../admin/data/admin-data.service';
import { LangService } from '../../core/lang.service';
import { SITE } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-booking', standalone: true, imports: [FormsModule, RouterLink, LangSwitchComponent], templateUrl: './booking.component.html', styleUrl: './booking.component.scss' })
export class BookingComponent {
  l = inject(LangService);
  private adminData = inject(AdminDataService);
  site = SITE;

  selected = Number(inject(ActivatedRoute).snapshot.queryParamMap.get('room')) || 1;
  f = { checkIn: '', checkOut: '', guests: '2 Guests', name: '', email: '', phone: '', note: '' };
  today = new Date().toISOString().slice(0, 10);
  sent = false;
  error = '';

  get rooms() { return this.adminData.rooms().filter(r => r.active); }
  get room() { return this.rooms.find(r => r.id === this.selected) ?? this.rooms[0]; }
  get nights() {
    if (!this.f.checkIn || !this.f.checkOut) return 0;
    return Math.max(0, Math.round((+new Date(this.f.checkOut) - +new Date(this.f.checkIn)) / 864e5));
  }
  get total() { return this.nights * (this.room?.price ?? 0); }

  submit() {
    if (!this.f.checkIn || !this.f.checkOut || this.nights < 1) { this.error = 'Please choose valid check-in and check-out dates.'; return; }
    if (!this.f.name || !this.f.phone) { this.error = 'Please enter your name and phone number.'; return; }
    this.error = '';

    // 1. Save as a Pending booking request in the Admin Panel
    this.adminData.addBooking({
      guestName: this.f.name.trim(),
      phone: this.f.phone.trim(),
      email: this.f.email.trim() || undefined,
      guests: parseInt(this.f.guests, 10) || 2,
      roomId: this.room.id,
      checkIn: this.f.checkIn,
      checkOut: this.f.checkOut,
      status: 'Pending',
      source: 'Website',
      note: this.f.note.trim() || undefined
    });

    // 2. Also open WhatsApp inquiry as before
    const msg = `Booking enquiry%0ARoom: ${this.room.name}%0ADates: ${this.f.checkIn} to ${this.f.checkOut} (${this.nights} nights)%0AGuests: ${this.f.guests}%0AName: ${this.f.name}%0APhone: ${this.f.phone}%0ANote: ${this.f.note}`;
    window.open(`https://wa.me/${this.site.whatsapp}?text=${msg}`, '_blank');
    this.sent = true;
  }
}