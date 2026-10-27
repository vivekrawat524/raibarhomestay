import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../admin/data/admin-data.service';
import { AdminRoom, toWhatsAppPhone } from '../../admin/data/admin.models';
import { LangService } from '../../core/lang.service';
import { SITE } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [FormsModule, RouterLink, LangSwitchComponent],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss'
})
export class BookingComponent implements OnInit {
  l = inject(LangService);
  private adminData = inject(AdminDataService);
  private route = inject(ActivatedRoute);
  site = SITE;

  /** Max 2 guests per room */
  readonly maxGuestsPerRoom = 2;

  /** Currently selected room IDs (1 room for 1-2 guests; 2 rooms auto-selected for 3-4 guests, etc.) */
  selectedIds: number[] = [1];

  /** Guest count options: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 */
  guestCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  f = { checkIn: '', checkOut: '', guests: 2, name: '', email: '', phone: '', note: '' };
  today = new Date().toISOString().slice(0, 10);
  sent = false;
  error = '';
  lastBookingId = '';
  lastWaUrl = '';

  ngOnInit() {
    const qRoom = Number(this.route.snapshot.queryParamMap.get('room'));
    const initialId = qRoom && this.rooms.some(r => r.id === qRoom) ? qRoom : (this.rooms[0]?.id ?? 1);
    this.selectedIds = [initialId];
  }

  get rooms(): AdminRoom[] {
    return this.adminData.rooms().filter(r => r.active);
  }

  /** Primary room shown in the hero preview image */
  get room(): AdminRoom {
    return this.rooms.find(r => r.id === this.selectedIds[0]) ?? this.rooms[0];
  }

  /** All currently selected room objects */
  get selectedRooms(): AdminRoom[] {
    const list = this.rooms.filter(r => this.selectedIds.includes(r.id));
    return list.length ? list : (this.rooms[0] ? [this.rooms[0]] : []);
  }

  /** Number of rooms required based on 2 guests per room */
  get requiredRoomsCount(): number {
    return Math.min(this.rooms.length || 1, Math.ceil((Number(this.f.guests) || 1) / this.maxGuestsPerRoom));
  }

  /** Combined nightly price of all selected rooms */
  get nightlyTotal(): number {
    return this.selectedRooms.reduce((sum, r) => sum + r.price, 0);
  }

  /** Names of selected rooms */
  get selectedRoomsNames(): string {
    return this.selectedRooms.map(r => r.name).join(' + ');
  }

  get nights(): number {
    if (!this.f.checkIn || !this.f.checkOut) return 0;
    return Math.max(0, Math.round((+new Date(this.f.checkOut) - +new Date(this.f.checkIn)) / 864e5));
  }

  get total(): number {
    return (this.nights || 1) * this.nightlyTotal;
  }

  isRoomSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  /** Automatically selects required rooms based on guest count (2 guests per room) */
  onGuestsChange(newGuests: number) {
    this.f.guests = Number(newGuests) || 2;
    const needed = this.requiredRoomsCount;

    if (needed === 1) {
      this.selectedIds = [this.selectedIds[0] ?? (this.rooms[0]?.id ?? 1)];
    } else {
      const current = [...this.selectedIds];
      for (const r of this.rooms) {
        if (current.length >= needed) break;
        if (!current.includes(r.id)) {
          current.push(r.id);
        }
      }
      this.selectedIds = current.slice(0, needed);
    }
  }

  /** Called when user clicks a room card in the room picker */
  selectRoom(id: number) {
    const needed = this.requiredRoomsCount;
    if (needed === 1) {
      this.selectedIds = [id];
      return;
    }

    if (this.selectedIds.includes(id)) {
      this.selectedIds = [id, ...this.selectedIds.filter(x => x !== id)];
    } else {
      this.selectedIds = [this.selectedIds[0], id, ...this.selectedIds.slice(1)].slice(0, needed);
    }
  }

  submit() {
    if (!this.f.checkIn || !this.f.checkOut || this.nights < 1) {
      this.error = 'Please choose valid check-in and check-out dates.';
      return;
    }
    if (!this.f.name || !this.f.phone) {
      this.error = 'Please enter your name and phone number.';
      return;
    }
    this.error = '';

    const primaryRoom = this.selectedRooms[0];
    const extraIds = this.selectedRooms.slice(1).map(r => r.id);
    const multiRoomNote =
      this.selectedRooms.length > 1
        ? `[${this.selectedRooms.length} Rooms: ${this.selectedRoomsNames}] `
        : '';
    const fullNote = (multiRoomNote + (this.f.note.trim() || '')).trim();

    // 1. Save as a Pending booking request in the Admin Panel
    const res = this.adminData.addBooking({
      guestName: this.f.name.trim(),
      phone: this.f.phone.trim(),
      email: this.f.email.trim() || undefined,
      guests: Number(this.f.guests) || 2,
      roomId: primaryRoom.id,
      extraRoomIds: extraIds.length ? extraIds : undefined,
      checkIn: this.f.checkIn,
      checkOut: this.f.checkOut,
      status: 'Pending',
      source: 'Website',
      note: fullNote || undefined
    });

    const bookingId = res.booking?.id ?? 'NEW';
    this.lastBookingId = bookingId;

    // 2. Prepare payload for WhatsApp API / Admin notification
    const adminPhone = toWhatsAppPhone(this.adminData.settings().whatsapp || this.site.whatsapp);
    const text =
      `*New Booking Request (${bookingId})* 🏔️\n` +
      `*Room(s):* ${this.selectedRoomsNames} (${this.selectedRooms.length} Room(s))\n` +
      `*Check-In:* ${this.f.checkIn}\n` +
      `*Check-Out:* ${this.f.checkOut} (${this.nights} night(s))\n` +
      `*Guests:* ${this.f.guests}\n` +
      `*Total Amount:* ₹${this.nights * this.nightlyTotal}\n\n` +
      `*Customer Details:*\n` +
      `*Name:* ${this.f.name.trim()}\n` +
      `*Phone/WhatsApp:* ${this.f.phone.trim()}\n` +
      `*Email:* ${this.f.email.trim() || 'Not provided'}\n` +
      `*Note:* ${this.f.note.trim() || 'None'}`;

    this.lastWaUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`;
    this.sent = true;
  }
}