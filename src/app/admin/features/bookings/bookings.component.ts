import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../data/admin-data.service';
import { BookingSource, BookingStatus, countNights } from '../../data/admin.models';
import { dayOffset } from '../../data/admin.seed';

@Component({
  selector: 'app-bookings',
  imports: [FormsModule],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent {
  data = inject(AdminDataService);

  statusFilter = signal<'All' | BookingStatus>('All');
  search = signal('');
  showNewForm = signal(false);
  feedback = signal<{ text: string; isError: boolean } | null>(null);

  statuses: ('All' | BookingStatus)[] = [
    'All',
    'Pending',
    'Confirmed',
    'CheckedIn',
    'CheckedOut',
    'Rejected',
    'Cancelled'
  ];

  sources: BookingSource[] = ['Phone', 'WhatsApp', 'WalkIn', 'Website'];

  /** Form model for adding a manual booking */
  form = {
    guestName: '',
    phone: '',
    email: '',
    guests: 2,
    roomId: 1,
    checkIn: dayOffset(0),
    checkOut: dayOffset(1),
    source: 'Phone' as BookingSource,
    status: 'Confirmed' as BookingStatus,
    note: ''
  };

  filteredBookings = computed(() => {
    const status = this.statusFilter();
    const q = this.search().trim().toLowerCase();

    return this.data.bookings().filter(b => {
      if (status !== 'All' && b.status !== status) return false;
      if (!q) return true;
      return (
        b.guestName.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    });
  });

  nights(checkIn: string, checkOut: string): number {
    return countNights(checkIn, checkOut);
  }

  waLink(phone: string, guestName: string): string {
    const digits = phone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Namaste ${guestName}, regarding your booking at RAIBAR HOMESTAY.`);
    return `https://wa.me/${digits}?text=${msg}`;
  }

  setStatus(id: string, status: BookingStatus) {
    const res = this.data.updateBookingStatus(id, status);
    this.feedback.set({
      text: res.ok ? `Booking ${id} marked as ${status}.` : (res.error ?? 'Could not update status.'),
      isError: !res.ok
    });
  }

  changeRoom(bookingId: string, newRoomId: number) {
    const res = this.data.assignRoom(bookingId, Number(newRoomId));
    this.feedback.set({
      text: res.ok ? `Room updated for booking ${bookingId}.` : (res.error ?? 'Could not reassign room.'),
      isError: !res.ok
    });
  }

  submitNewBooking() {
    if (!this.form.guestName.trim() || !this.form.phone.trim()) {
      this.feedback.set({ text: 'Please enter guest name and phone number.', isError: true });
      return;
    }
    if (!this.form.checkIn || !this.form.checkOut || this.form.checkOut <= this.form.checkIn) {
      this.feedback.set({ text: 'Check-out date must be after check-in date.', isError: true });
      return;
    }

    const res = this.data.addBooking({
      guestName: this.form.guestName.trim(),
      phone: this.form.phone.trim(),
      email: this.form.email.trim() || undefined,
      guests: Number(this.form.guests) || 1,
      roomId: Number(this.form.roomId),
      checkIn: this.form.checkIn,
      checkOut: this.form.checkOut,
      status: this.form.status,
      source: this.form.source,
      note: this.form.note.trim() || undefined
    });

    if (!res.ok) {
      this.feedback.set({ text: res.error ?? 'Could not add booking.', isError: true });
      return;
    }

    this.feedback.set({ text: `Added booking ${res.booking!.id} for ${res.booking!.guestName}.`, isError: false });
    this.showNewForm.set(false);
    this.form = {
      guestName: '',
      phone: '',
      email: '',
      guests: 2,
      roomId: 1,
      checkIn: dayOffset(0),
      checkOut: dayOffset(1),
      source: 'Phone',
      status: 'Confirmed',
      note: ''
    };
  }
}