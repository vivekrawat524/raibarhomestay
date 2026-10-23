export interface BlockedRange {
  id: string;
  from: string;   // YYYY-MM-DD (inclusive)
  to: string;     // YYYY-MM-DD (exclusive, checkout day)
  reason: string;
}

export interface AdminRoom {
  id: number;
  name: string;
  desc: string;
  price: number;        // fixed price per night (INR)
  capacity: number;     // max guests in this whole room
  img: string;
  tags: string[];
  active: boolean;      // false = hidden/deactivated without deleting old bookings
  blockedDates: BlockedRange[];
}

export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'CheckedIn'
  | 'CheckedOut'
  | 'Rejected'
  | 'Cancelled';

export type BookingSource = 'Website' | 'WhatsApp' | 'Phone' | 'WalkIn';

export interface AdminBooking {
  id: string;
  guestName: string;
  phone: string;
  email?: string;
  guests: number;
  roomId: number;
  checkIn: string;      // YYYY-MM-DD
  checkOut: string;     // YYYY-MM-DD
  status: BookingStatus;
  source: BookingSource;
  note?: string;
  total: number;
  createdAt: string;    // YYYY-MM-DD
}

export interface TripDeparture {
  id: string;
  date: string;         // YYYY-MM-DD
  capacity: number;     // max travellers for this departure
  booked: number;       // seats already booked
}

export interface AdminTrip {
  id: number;
  days: number;
  title: string;
  desc: string;
  price: number;              // price per person (INR)
  img: string;
  fixedTemples: string[];     // temple keys from TEMPLES (e.g. 'bh', 'ar')
  optionalTemples: string[];  // optional trek/add-on temple keys
  active: boolean;
  departures: TripDeparture[];
}

/**
 * Half-open date range check: [aFrom, aTo) overlaps [bFrom, bTo).
 * Allows a new guest to check in on the exact day the previous guest checks out.
 */
export function datesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string): boolean {
  return aFrom < bTo && bFrom < aTo;
}

/** Number of nights between two YYYY-MM-DD dates (minimum 1) */
export function countNights(checkIn: string, checkOut: string): number {
  const ms = +new Date(checkOut) - +new Date(checkIn);
  return Math.max(1, Math.round(ms / 86_400_000));
}