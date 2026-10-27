import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../data/admin-data.service';
import {
  AdminBooking,
  AdminTripBooking,
  BookingSource,
  BookingStatus,
  countNights,
  formatStayDate
} from '../../data/admin.models';
import { dayOffset } from '../../data/admin.seed';

@Component({
  selector: 'app-bookings',
  imports: [FormsModule],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent {
  data = inject(AdminDataService);

  /** Two-page switcher: 'room' = Room Bookings page, 'trip' = Trip Bookings page */
  pageMode = signal<'room' | 'trip'>('room');

  statusFilter = signal<'All' | BookingStatus>('All');
  search = signal('');
  showNewForm = signal(false);
  feedback = signal<{ text: string; isError: boolean } | null>(null);

  activeRoomBookingId = signal<string | null>(null);
  activeTripBookingId = signal<string | null>(null);

  activeRoomBooking = computed<AdminBooking | undefined>(() => {
    const id = this.activeRoomBookingId();
    return id ? this.data.bookings().find(b => b.id === id) : undefined;
  });

  activeTripBooking = computed<AdminTripBooking | undefined>(() => {
    const id = this.activeTripBookingId();
    return id ? this.data.tripBookings().find(t => t.id === id) : undefined;
  });

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

  /** Form model for adding a manual Room Booking */
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

  /** Form model for adding a manual Trip Booking */
  tripForm = {
    guestName: '',
    phone: '',
    email: '',
    travellers: 2,
    tripId: 1,
    startDate: dayOffset(1),
    optionalTemples: '',
    status: 'Confirmed' as BookingStatus
  };

  /** Room bookings sorted by ID in DESCENDING order (BK-4, BK-3, BK-2, BK-1) */
  filteredRoomBookings = computed(() => {
    const status = this.statusFilter();
    const q = this.search().trim().toLowerCase();

    return this.data
      .bookings()
      .filter(b => {
        if (status !== 'All' && b.status !== status) return false;
        if (!q) return true;
        return (
          b.guestName.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q) ||
          (b.email?.toLowerCase().includes(q) ?? false) ||
          b.id.toLowerCase().includes(q)
        );
      })
      .slice()
      .sort((a, b) => this.extractIdNum(b.id) - this.extractIdNum(a.id));
  });

  /** Trip bookings sorted by ID in DESCENDING order (TB-3, TB-2, TB-1) */
  filteredTripBookings = computed(() => {
    const status = this.statusFilter();
    const q = this.search().trim().toLowerCase();

    return this.data
      .tripBookings()
      .filter(t => {
        if (status !== 'All' && t.status !== status) return false;
        if (!q) return true;
        return (
          t.guestName.toLowerCase().includes(q) ||
          t.phone.toLowerCase().includes(q) ||
          (t.email?.toLowerCase().includes(q) ?? false) ||
          t.id.toLowerCase().includes(q) ||
          t.tripTitle.toLowerCase().includes(q)
        );
      })
      .slice()
      .sort((a, b) => this.extractIdNum(b.id) - this.extractIdNum(a.id));
  });

  private extractIdNum(id: string): number {
    const n = parseInt(id.replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? 0 : n;
  }

  switchPage(mode: 'room' | 'trip') {
    this.pageMode.set(mode);
    this.statusFilter.set('All');
    this.search.set('');
    this.showNewForm.set(false);
    this.feedback.set(null);
  }

  formatDate(ymd: string): string {
    return formatStayDate(ymd);
  }

  roomName(roomId: number): string {
    return this.data.roomById(roomId)?.name ?? `Room #${roomId}`;
  }

  roomPrice(roomId: number): number {
    return this.data.roomById(roomId)?.price ?? 0;
  }

  statusLabel(st: string): string {
    if (st === 'CheckedIn') return 'Checked In';
    if (st === 'CheckedOut') return 'Checked Out';
    return st;
  }

  nights(checkIn: string, checkOut: string): number {
    return countNights(checkIn, checkOut);
  }

  openRoomCustomer(id: string) {
    this.activeTripBookingId.set(null);
    this.activeRoomBookingId.set(id);
  }

  openTripCustomer(id: string) {
    this.activeRoomBookingId.set(null);
    this.activeTripBookingId.set(id);
  }

  closeCustomer() {
    this.activeRoomBookingId.set(null);
    this.activeTripBookingId.set(null);
  }

  markPaid(id: string) {
    this.data.markBookingPaid(id, 'UPI / Online');
    this.feedback.set({ text: `Room booking ${id} marked as Paid ✓`, isError: false });
  }

  setStatus(id: string, status: BookingStatus) {
    const res = this.data.updateBookingStatus(id, status);
    this.feedback.set({
      text: res.ok
        ? `Room booking ${id} updated to "${this.statusLabel(status)}".`
        : (res.error ?? 'Could not update status.'),
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

  setTripStatus(id: string, status: BookingStatus) {
    this.data.updateTripBookingStatus(id, status);
    this.feedback.set({
      text: `Trip booking ${id} updated to "${this.statusLabel(status)}".`,
      isError: false
    });
  }

  markTripPaid(id: string) {
    this.data.markTripBookingPaid(id);
    this.feedback.set({ text: `Trip booking ${id} marked as Paid ✓`, isError: false });
  }

  submitNewRoomBooking() {
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

    this.feedback.set({ text: `Added room booking ${res.booking!.id} for ${res.booking!.guestName}.`, isError: false });
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

  submitNewTripBooking() {
    if (!this.tripForm.guestName.trim() || !this.tripForm.phone.trim() || !this.tripForm.startDate) {
      this.feedback.set({ text: 'Please enter guest name, phone number, and start date.', isError: true });
      return;
    }

    const created = this.data.addTripBooking({
      guestName: this.tripForm.guestName,
      phone: this.tripForm.phone,
      travellers: Number(this.tripForm.travellers) || 2,
      tripId: Number(this.tripForm.tripId),
      startDate: this.tripForm.startDate,
      optionalTemples: this.tripForm.optionalTemples.trim() || 'None',
      status: this.tripForm.status
    });

    this.feedback.set({ text: `Added trip booking ${created.id} for ${created.guestName}.`, isError: false });
    this.showNewForm.set(false);
    this.tripForm = {
      guestName: '',
      phone: '',
      email: '',
      travellers: 2,
      tripId: 1,
      startDate: dayOffset(1),
      optionalTemples: '',
      status: 'Confirmed'
    };
  }
}