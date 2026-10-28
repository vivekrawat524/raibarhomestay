export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'CheckedIn'
  | 'CheckedOut'
  | 'Rejected'
  | 'Cancelled';

export type PaymentStatus =
  | 'Paid'
  | 'Unpaid'
  | 'Partial'
  | 'Refunded'
  | 'AwaitingPayment';

export type BookingSource =
  | 'Website'
  | 'WhatsApp'
  | 'Phone'
  | 'WalkIn'
  | 'Booking.com'
  | 'Airbnb';

export interface BlockedRange {
  id: string;
  from: string;
  to: string;
  reason?: string;
}

export interface TripDeparture {
  id: string;
  date: string;
  capacity: number;
  booked: number;
}

export interface AdminBooking {
  id: string;                 // BK-1, BK-2...
  guestName: string;
  phone: string;
  email?: string;
  guests: number;
  roomId: number;             // Primary room ID
  extraRoomIds?: number[];    // Additional room IDs for multi-room group bookings
  checkIn: string;            // YYYY-MM-DD
  checkOut: string;           // YYYY-MM-DD
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  total: number;
  createdAt: string;          // YYYY-MM-DD
  source: BookingSource;
  note?: string;
  paidAt?: string;
}

export interface AdminRoom {
  id: number;
  name: string;
  price: number;
  desc?: string;
  capacity?: number;
  maxGuests?: number;
  bed?: string;
  view?: string;
  balcony?: boolean;
  tags: string[];
  active: boolean;
  img: string;
  gallery?: string[];
  description?: string;
  blockedDates: BlockedRange[];
}

export interface AdminTrip {
  id: number;
  title: string;
  days: number;
  price: number;              // per person
  img: string;
  desc: string;
  fixedTemples: string[];
  optionalTemples: string[];
  active: boolean;
  departures: TripDeparture[];
}

export interface AdminTripBooking {
  id: string;                 // TB-1, TB-2...
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

/** Individual chunk extracted from an uploaded document */
export interface KnowledgeChunk {
  id: string;
  docId: string;
  docName: string;
  category: string;
  text: string;
  wordCount: number;
  keywords: string[];
}

/** Uploaded document in the Knowledge Base library */
export interface KnowledgeDocument {
  id: string;
  name: string;
  fileType: string;
  fileSize: string;
  uploadedAt: string;
  chunksCount: number;
  summary?: string;
  chunks: KnowledgeChunk[];
}

/** Ranked search hit returned by the RAG retrieval engine */
export interface RetrievedHit {
  chunk: KnowledgeChunk;
  score: number;
  rank: number;
}

/** Answer returned to the guest or tester with grounded sources */
export interface AssistantAnswer {
  answer: string;
  sources: { title: string; docName: string; score: number }[];
  retrievedHits: RetrievedHit[];
  actionLink?: string;
  actionLabel?: string;
  latencyMs: number;
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
