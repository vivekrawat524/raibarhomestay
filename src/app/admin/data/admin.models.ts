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
  capacity: number;     // max guests in this whole room (2 guests per room)
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

export type PaymentStatus = 'Unpaid' | 'AwaitingPayment' | 'Paid';

export interface AdminBooking {
  id: string;
  guestName: string;
  phone: string;
  email?: string;
  guests: number;
  roomId: number;
  extraRoomIds?: number[]; // additional rooms auto-selected when guests > 2 (2 guests max per room)
  checkIn: string;         // YYYY-MM-DD
  checkOut: string;        // YYYY-MM-DD
  status: BookingStatus;
  source: BookingSource;
  note?: string;
  total: number;
  createdAt: string;       // YYYY-MM-DD
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  paidAt?: string;
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

export interface AdminTripBooking {
  id: string;                 // e.g. TB-1
  guestName: string;
  phone: string;
  email?: string;
  travellers: number;
  tripId: number;
  tripTitle: string;
  startDate: string;          // YYYY-MM-DD
  endDate: string;            // YYYY-MM-DD
  optionalTemples?: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  total: number;
  createdAt: string;
}

export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
}

export type ReviewStatus = 'Pending' | 'Approved' | 'Hidden';

export interface AdminReview {
  id: string;
  name: string;
  rating: number;
  stay: string;
  text: string;
  date: string;
  status: ReviewStatus;
}

/** Custom RAG Knowledge Base Document managed by Admin */
export interface RagKnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
}

export interface RagAnswer {
  answer: string;
  sources: string[];
  actionLink?: string;
  actionLabel?: string;
}

export interface SiteContent {
  heroTagline: string;
  aboutHeading: string;
  aboutText: string;
  gallery: GalleryPhoto[];
}

export interface BusinessSettings {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
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

/** Ensures Indian 10-digit numbers have the 91 country code for wa.me links */
export function toWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.length === 11 && digits.startsWith('0')) return '91' + digits.slice(1);
  return digits;
}

/** Formats YYYY-MM-DD as '16 Oct 2026' */
export function formatStayDate(ymd: string): string {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}