import { Injectable, computed, signal } from '@angular/core';
import { AdminBooking, AdminRoom, BookingStatus, countNights, datesOverlap } from './admin.models';
import { SEED_ROOMS, buildSeedBookings, dayOffset } from './admin.seed';

const ROOMS_KEY = 'raibar-admin-rooms-v1';
const BOOKINGS_KEY = 'raibar-admin-bookings-v1';

/** Statuses that occupy a room on the calendar */
const ACTIVE_STATUSES: BookingStatus[] = ['Confirmed', 'CheckedIn'];

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  rooms = signal<AdminRoom[]>(this.loadRooms());
  bookings = signal<AdminBooking[]>(this.loadBookings());

  today = dayOffset(0);

  /** Bookings waiting for the owner to Confirm or Reject */
  pendingBookings = computed(() =>
    this.bookings().filter(b => b.status === 'Pending')
  );

  /** Confirmed guests arriving today */
  arrivalsToday = computed(() =>
    this.bookings().filter(
      b => b.checkIn === this.today && (b.status === 'Confirmed' || b.status === 'CheckedIn')
    )
  );

  /** Guests checking out today */
  departuresToday = computed(() =>
    this.bookings().filter(
      b => b.checkOut === this.today && (b.status === 'Confirmed' || b.status === 'CheckedIn')
    )
  );

  /** Active rooms that are free tonight */
  freeRoomsTonight = computed(() => {
    const tomorrow = dayOffset(1);
    return this.rooms().filter(
      r => r.active && !this.hasRoomConflict(r.id, this.today, tomorrow)
    );
  });

  roomById(id: number): AdminRoom | undefined {
    return this.rooms().find(r => r.id === id);
  }

  /**
   * Returns true if the room is already booked (Confirmed/CheckedIn) or blocked
   * during [checkIn, checkOut).
   */
  hasRoomConflict(
    roomId: number,
    checkIn: string,
    checkOut: string,
    ignoreBookingId?: string
  ): boolean {
    const room = this.roomById(roomId);
    if (!room) return true;

    const blockedHit = room.blockedDates.some(b =>
      datesOverlap(checkIn, checkOut, b.from, b.to)
    );
    if (blockedHit) return true;

    return this.bookings().some(
      b =>
        b.id !== ignoreBookingId &&
        b.roomId === roomId &&
        ACTIVE_STATUSES.includes(b.status) &&
        datesOverlap(checkIn, checkOut, b.checkIn, b.checkOut)
    );
  }

  /** Change a booking status (e.g. Confirm, Reject, Cancel, CheckIn, CheckOut) */
  updateBookingStatus(id: string, status: BookingStatus): { ok: boolean; error?: string } {
    const target = this.bookings().find(b => b.id === id);
    if (!target) return { ok: false, error: 'Booking not found.' };

    if (
      ACTIVE_STATUSES.includes(status) &&
      this.hasRoomConflict(target.roomId, target.checkIn, target.checkOut, target.id)
    ) {
      return {
        ok: false,
        error: 'This room is already booked or blocked for those dates.'
      };
    }

    this.bookings.update(list =>
      list.map(b => (b.id === id ? { ...b, status } : b))
    );
    this.saveBookings();
    return { ok: true };
  }

  /** Create a new manual or website booking */
  addBooking(
    data: Omit<AdminBooking, 'id' | 'total' | 'createdAt'>
  ): { ok: boolean; error?: string; booking?: AdminBooking } {
    const room = this.roomById(data.roomId);
    if (!room) return { ok: false, error: 'Please select a valid room.' };

    if (
      ACTIVE_STATUSES.includes(data.status) &&
      this.hasRoomConflict(data.roomId, data.checkIn, data.checkOut)
    ) {
      return {
        ok: false,
        error: 'This room is already booked or blocked for those dates.'
      };
    }

    const nights = countNights(data.checkIn, data.checkOut);
    const booking: AdminBooking = {
      ...data,
      id: 'BK-' + (100 + this.bookings().length + 1),
      total: nights * room.price,
      createdAt: this.today
    };

    this.bookings.update(list => [booking, ...list]);
    this.saveBookings();
    return { ok: true, booking };
  }

  /** Reset mock data back to the initial seed state */
  resetDemoData() {
    this.rooms.set(structuredClone(SEED_ROOMS));
    this.bookings.set(buildSeedBookings());
    this.saveRooms();
    this.saveBookings();
  }

  private loadRooms(): AdminRoom[] {
    try {
      const raw = localStorage.getItem(ROOMS_KEY);
      return raw ? JSON.parse(raw) : structuredClone(SEED_ROOMS);
    } catch {
      return structuredClone(SEED_ROOMS);
    }
  }

  private loadBookings(): AdminBooking[] {
    try {
      const raw = localStorage.getItem(BOOKINGS_KEY);
      return raw ? JSON.parse(raw) : buildSeedBookings();
    } catch {
      return buildSeedBookings();
    }
  }

  private saveRooms() {
    try { localStorage.setItem(ROOMS_KEY, JSON.stringify(this.rooms())); } catch { /* ignore */ }
  }

  private saveBookings() {
    try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(this.bookings())); } catch { /* ignore */ }
  }
}