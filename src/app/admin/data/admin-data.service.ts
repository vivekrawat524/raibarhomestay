import { Injectable, computed, signal } from '@angular/core';
import { TEMPLES } from '../../core/site.data';
import {
  AdminBooking,
  AdminReview,
  AdminRoom,
  AdminTrip,
  AdminTripBooking,
  BlockedRange,
  BookingStatus,
  BusinessSettings,
  PaymentStatus,
  RagAnswer,
  RagKnowledgeDoc,
  ReviewStatus,
  SiteContent,
  TripDeparture,
  countNights,
  datesOverlap,
  formatStayDate,
  toWhatsAppPhone
} from './admin.models';
import {
  SEED_ROOMS,
  buildSeedBookings,
  buildSeedContent,
  buildSeedReviews,
  buildSeedSettings,
  buildSeedTripBookings,
  buildSeedTrips,
  dayOffset
} from './admin.seed';

const ROOMS_KEY = 'raibar-admin-rooms-v1';
const BOOKINGS_KEY = 'raibar-admin-bookings-v2';
const TRIPS_KEY = 'raibar-admin-trips-v1';
const TRIP_BOOKINGS_KEY = 'raibar-admin-trip-bookings-v1';
const CONTENT_KEY = 'raibar-admin-content-v1';
const REVIEWS_KEY = 'raibar-admin-reviews-v1';
const SETTINGS_KEY = 'raibar-admin-settings-v1';
const RAG_DOCS_KEY = 'raibar-admin-rag-docs-v1';
const GEMINI_KEY_STORAGE = 'raibar-admin-gemini-key-v1';

/** Statuses that occupy a room on the calendar */
const ACTIVE_STATUSES: BookingStatus[] = ['Confirmed', 'CheckedIn'];

const SEED_RAG_DOCS: RagKnowledgeDoc[] = [
  {
    id: 'KB-1',
    title: 'Food & Homemade Pahadi Meals',
    category: 'Food & Dining',
    content:
      'Food is not included in the base room tariff; guests pay extra for meals. We serve fresh, home-cooked Garhwali / Pahadi vegetarian meals (Mandua roti, Pahadi dal, seasonal organic vegetables, tea & breakfast) prepared on order.',
    keywords: ['food', 'meal', 'breakfast', 'dinner', 'lunch', 'khana', 'eat', 'pahadi', 'included', 'extra', 'भोजन', 'खाना']
  },
  {
    id: 'KB-2',
    title: 'Multi-Room Booking Rule (Max 2 Guests per Room)',
    category: 'Booking Rules',
    content:
      'Each room at Raibar Homestay accommodates a maximum of 2 guests. If you are 3 or 4 guests, our booking page automatically selects 2 rooms for your group so everyone stays comfortably.',
    keywords: ['guest', 'guests', 'people', 'person', 'capacity', 'multiple', 'family', 'group', '4', '3', 'मेहमान', 'लोग']
  },
  {
    id: 'KB-3',
    title: 'How to Reach & Location (Kainyur, Thalisain, Pauri Garhwal)',
    category: 'Location & Travel',
    content:
      'Raibar Homestay is located in Nagar Panchayat Kainyur, Thalisain, Pauri Garhwal, Uttarakhand (246285). Nearest railway stations are Kotdwar and Ramnagar. Peaceful mountain roads connect directly to our property with parking available.',
    keywords: ['location', 'address', 'reach', 'where', 'direction', 'map', 'train', 'station', 'kotdwar', 'ramnagar', 'pauri', 'thalisain', 'kainyur', 'पता', 'कहाँ']
  },
  {
    id: 'KB-4',
    title: 'Amenities & Wi-Fi (Work from Mountains)',
    category: 'Amenities',
    content:
      'All rooms include high-speed Wi-Fi, hot water (geyser), balcony or garden sit-out, mountain/valley views, clean attached washrooms, and local temple travel guidance.',
    keywords: ['wifi', 'internet', 'amenity', 'amenities', 'hot water', 'geyser', 'parking', 'balcony', 'garden', 'view', 'facility', 'सुविधा']
  }
];

@Injectable({ providedIn: 'root' })
export class AdminDataService {
  rooms = signal<AdminRoom[]>(this.loadRooms());
  bookings = signal<AdminBooking[]>(this.loadBookings());
  trips = signal<AdminTrip[]>(this.loadTrips());
  tripBookings = signal<AdminTripBooking[]>(this.loadTripBookings());
  content = signal<SiteContent>(this.loadContent());
  reviews = signal<AdminReview[]>(this.loadReviews());
  settings = signal<BusinessSettings>(this.loadSettings());
  ragDocs = signal<RagKnowledgeDoc[]>(this.loadRagDocs());
  geminiApiKey = signal<string>(this.loadGeminiKey());

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

  bookingById(id: string): AdminBooking | undefined {
    return this.bookings().find(b => b.id.toLowerCase() === id.toLowerCase());
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
  updateBookingStatus(
    id: string,
    status: BookingStatus
  ): { ok: boolean; error?: string; booking?: AdminBooking; waUrl?: string } {
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

    const paymentStatus: PaymentStatus =
      target.paymentStatus === 'Paid'
        ? 'Paid'
        : status === 'Confirmed'
          ? 'AwaitingPayment'
          : (target.paymentStatus ?? 'Unpaid');

    const updated: AdminBooking = { ...target, status, paymentStatus };
    this.bookings.update(list =>
      list.map(b => (b.id === id ? updated : b))
    );
    this.saveBookings();

    const waUrl = this.buildCustomerWhatsAppUrl(updated, status);
    return { ok: true, booking: updated, waUrl };
  }

  /** Build WhatsApp link to send to the customer when admin accepts/rejects or shares payment link */
  buildCustomerWhatsAppUrl(booking: AdminBooking, status: BookingStatus = booking.status): string {
    const phone = toWhatsAppPhone(booking.phone);
    const roomName = this.roomById(booking.roomId)?.name ?? `Room #${booking.roomId}`;
    const nights = countNights(booking.checkIn, booking.checkOut);
    const payUrl = `${window.location.origin}/pay/${booking.id}`;
    const inDate = formatStayDate(booking.checkIn);
    const outDate = formatStayDate(booking.checkOut);

    let msg = '';
    if (status === 'Confirmed') {
      msg =
        `Namaste ${booking.guestName} 🙏\n` +
        `Your booking request at *${this.settings().name}* has been *ACCEPTED*!\n\n` +
        `*Booking ID:* ${booking.id}\n` +
        `*Room:* ${roomName}\n` +
        `*Check-In:* ${inDate}\n` +
        `*Check-Out:* ${outDate} (${nights} night(s))\n` +
        `*Guests:* ${booking.guests}\n` +
        `*Total Amount:* ₹${booking.total}\n\n` +
        `Please complete your payment on our website using this link to confirm your reservation:\n` +
        `${payUrl}`;
    } else if (status === 'Rejected' || status === 'Cancelled') {
      msg =
        `Namaste ${booking.guestName},\n` +
        `Regarding your booking request (${booking.id}) at *${this.settings().name}* for ${inDate} to ${outDate}:\n` +
        `We are sorry, ${roomName} is not available for those dates. Please message us if you would like to check alternate dates.`;
    } else {
      msg = `Namaste ${booking.guestName}, regarding your booking ${booking.id} (${inDate} to ${outDate}) at ${this.settings().name}.`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  /** Mark a booking as Paid (when customer pays on /pay/:id or admin marks paid) */
  markBookingPaid(id: string, method = 'Online / UPI'): { ok: boolean; booking?: AdminBooking } {
    const target = this.bookingById(id);
    if (!target) return { ok: false };

    const updated: AdminBooking = {
      ...target,
      status: target.status === 'Pending' ? 'Confirmed' : target.status,
      paymentStatus: 'Paid',
      paymentMethod: method,
      paidAt: this.today
    };

    this.bookings.update(list =>
      list.map(b => (b.id === target.id ? updated : b))
    );
    this.saveBookings();
    return { ok: true, booking: updated };
  }

  /** Add a new customer or manual Trip Booking */
  addTripBooking(data: {
    guestName: string;
    phone: string;
    travellers: number;
    tripId: number;
    startDate: string;
    optionalTemples?: string;
    status?: BookingStatus;
    paymentStatus?: PaymentStatus;
  }): AdminTripBooking {
    const trip = this.trips().find(t => t.id === data.tripId) ?? this.trips()[0];
    const days = trip?.days ?? 2;
    const price = trip?.price ?? 2999;

    const end = new Date(data.startDate);
    end.setDate(end.getDate() + Math.max(0, days - 1));
    const endDate = end.toISOString().slice(0, 10);

    const maxNum = this.tripBookings().reduce((max, tb) => {
      const num = parseInt(tb.id.replace(/\D/g, ''), 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const created: AdminTripBooking = {
      id: 'TB-' + (maxNum + 1),
      guestName: data.guestName.trim(),
      phone: data.phone.trim(),
      travellers: data.travellers,
      tripId: trip?.id ?? data.tripId,
      tripTitle: trip?.title ?? 'Temple Trip',
      startDate: data.startDate,
      endDate,
      optionalTemples: data.optionalTemples,
      status: data.status ?? 'Pending',
      paymentStatus: data.paymentStatus ?? 'Unpaid',
      total: price * data.travellers,
      createdAt: this.today
    };

    this.tripBookings.update(list => [created, ...list]);
    this.saveTripBookings();
    return created;
  }

  /** Update Trip Booking status (Confirm / Reject / Cancel) */
  updateTripBookingStatus(id: string, status: BookingStatus) {
    this.tripBookings.update(list =>
      list.map(tb => {
        if (tb.id !== id) return tb;
        const paymentStatus: PaymentStatus =
          tb.paymentStatus === 'Paid'
            ? 'Paid'
            : status === 'Confirmed'
              ? 'AwaitingPayment'
              : tb.paymentStatus;
        return { ...tb, status, paymentStatus };
      })
    );
    this.saveTripBookings();
  }

  /** Mark a Trip Booking as Paid */
  markTripBookingPaid(id: string) {
    this.tripBookings.update(list =>
      list.map(tb =>
        tb.id === id
          ? {
              ...tb,
              status: tb.status === 'Pending' ? 'Confirmed' : tb.status,
              paymentStatus: 'Paid',
              paymentMethod: tb.paymentMethod || 'UPI / Online'
            }
          : tb
      )
    );
    this.saveTripBookings();
  }

  /** Reassign a booking to a different room (validating overlap & updating total price) */
  assignRoom(bookingId: string, roomId: number): { ok: boolean; error?: string } {
    const target = this.bookings().find(b => b.id === bookingId);
    const room = this.roomById(roomId);
    if (!target || !room) return { ok: false, error: 'Invalid booking or room.' };

    if (
      ACTIVE_STATUSES.includes(target.status) &&
      this.hasRoomConflict(roomId, target.checkIn, target.checkOut, target.id)
    ) {
      return {
        ok: false,
        error: `${room.name} is already booked or blocked for those dates.`
      };
    }

    const total = countNights(target.checkIn, target.checkOut) * room.price;
    this.bookings.update(list =>
      list.map(b => (b.id === bookingId ? { ...b, roomId, total } : b))
    );
    this.saveBookings();
    return { ok: true };
  }

  /** Create a new manual or website booking (Booking IDs start from BK-1) */
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

    const maxNum = this.bookings().reduce((max, b) => {
      const num = parseInt(b.id.replace(/\D/g, ''), 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const extraRooms = (data.extraRoomIds ?? [])
      .map(id => this.roomById(id))
      .filter((r): r is AdminRoom => !!r);
    const nightlyPrice = room.price + extraRooms.reduce((sum, r) => sum + r.price, 0);

    const nights = countNights(data.checkIn, data.checkOut);
    const booking: AdminBooking = {
      ...data,
      id: 'BK-' + (maxNum + 1),
      total: nights * nightlyPrice,
      createdAt: this.today,
      paymentStatus: data.paymentStatus ?? (data.status === 'Confirmed' ? 'AwaitingPayment' : 'Unpaid')
    };

    this.bookings.update(list => [booking, ...list]);
    this.saveBookings();
    return { ok: true, booking };
  }

  /** Add a new room or update an existing room */
  saveRoom(roomData: Omit<AdminRoom, 'id' | 'blockedDates'> & { id?: number }): AdminRoom {
    if (roomData.id) {
      let updated!: AdminRoom;
      this.rooms.update(list =>
        list.map(r => {
          if (r.id === roomData.id) {
            updated = { ...r, ...roomData, id: r.id };
            return updated;
          }
          return r;
        })
      );
      this.saveRooms();
      return updated;
    }

    const nextId = this.rooms().reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const created: AdminRoom = {
      ...roomData,
      id: nextId,
      blockedDates: []
    };
    this.rooms.update(list => [...list, created]);
    this.saveRooms();
    return created;
  }

  /** Activate or deactivate a room */
  toggleRoomActive(roomId: number) {
    this.rooms.update(list =>
      list.map(r => (r.id === roomId ? { ...r, active: !r.active } : r))
    );
    this.saveRooms();
  }

  /** Block dates on a room for maintenance or personal use */
  addBlockedRange(
    roomId: number,
    from: string,
    to: string,
    reason: string
  ): { ok: boolean; error?: string } {
    if (!from || !to || to <= from) {
      return { ok: false, error: 'End date must be after start date.' };
    }
    const hasGuestBooking = this.bookings().some(
      b =>
        b.roomId === roomId &&
        ACTIVE_STATUSES.includes(b.status) &&
        datesOverlap(from, to, b.checkIn, b.checkOut)
    );
    if (hasGuestBooking) {
      return { ok: false, error: 'Cannot block dates that already have a confirmed guest booking.' };
    }

    const block: BlockedRange = {
      id: 'BL-' + Date.now(),
      from,
      to,
      reason: reason.trim() || 'Maintenance / Owner use'
    };

    this.rooms.update(list =>
      list.map(r =>
        r.id === roomId ? { ...r, blockedDates: [...r.blockedDates, block] } : r
      )
    );
    this.saveRooms();
    return { ok: true };
  }

  /** Remove a blocked date range from a room */
  removeBlockedRange(roomId: number, blockId: string) {
    this.rooms.update(list =>
      list.map(r =>
        r.id === roomId
          ? { ...r, blockedDates: r.blockedDates.filter(b => b.id !== blockId) }
          : r
      )
    );
    this.saveRooms();
  }

  /** Add a new travel package or update an existing one */
  saveTrip(tripData: Omit<AdminTrip, 'id' | 'departures'> & { id?: number }): AdminTrip {
    if (tripData.id) {
      let updated!: AdminTrip;
      this.trips.update(list =>
        list.map(t => {
          if (t.id === tripData.id) {
            updated = { ...t, ...tripData, id: t.id };
            return updated;
          }
          return t;
        })
      );
      this.saveTrips();
      return updated;
    }

    const nextId = this.trips().reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const created: AdminTrip = {
      ...tripData,
      id: nextId,
      departures: []
    };
    this.trips.update(list => [...list, created]);
    this.saveTrips();
    return created;
  }

  /** Activate or hide a travel package */
  toggleTripActive(tripId: number) {
    this.trips.update(list =>
      list.map(t => (t.id === tripId ? { ...t, active: !t.active } : t))
    );
    this.saveTrips();
  }

  /** Add a scheduled departure date & seat capacity to a travel package */
  addTripDeparture(
    tripId: number,
    date: string,
    capacity: number
  ): { ok: boolean; error?: string } {
    if (!date || capacity < 1) {
      return { ok: false, error: 'Please enter a valid departure date and seat capacity.' };
    }
    const dep: TripDeparture = {
      id: 'DEP-' + Date.now(),
      date,
      capacity: Number(capacity),
      booked: 0
    };
    this.trips.update(list =>
      list.map(t =>
        t.id === tripId ? { ...t, departures: [...t.departures, dep] } : t
      )
    );
    this.saveTrips();
    return { ok: true };
  }

  /** Remove a departure date from a travel package */
  removeTripDeparture(tripId: number, depId: string) {
    this.trips.update(list =>
      list.map(t =>
        t.id === tripId
          ? { ...t, departures: t.departures.filter(d => d.id !== depId) }
          : t
      )
    );
    this.saveTrips();
  }

  /** Save homepage text */
  saveSiteText(heroTagline: string, aboutHeading: string, aboutText: string) {
    this.content.update(c => ({ ...c, heroTagline, aboutHeading, aboutText }));
    this.saveContent();
  }

  /** Add a photo to the website gallery */
  addGalleryPhoto(src: string, alt: string) {
    const item = { id: 'G-' + Date.now(), src: src.trim(), alt: alt.trim() || 'Homestay photo' };
    this.content.update(c => ({ ...c, gallery: [item, ...c.gallery] }));
    this.saveContent();
  }

  /** Remove a photo from the website gallery */
  removeGalleryPhoto(id: string) {
    this.content.update(c => ({ ...c, gallery: c.gallery.filter(g => g.id !== id) }));
    this.saveContent();
  }

  /** Submit a new guest review from the website (starts as 'Pending' until Admin approves) */
  addReview(data: { name: string; rating: number; stay: string; text: string }): AdminReview {
    const maxNum = this.reviews().reduce((max, r) => {
      const num = parseInt(r.id.replace(/\D/g, ''), 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const created: AdminReview = {
      id: 'RV-' + (maxNum + 1),
      name: data.name.trim(),
      rating: data.rating,
      stay: data.stay,
      text: data.text.trim(),
      date: this.today,
      status: 'Pending'
    };

    this.reviews.update(list => [created, ...list]);
    this.saveReviews();
    return created;
  }

  /** Approve or hide a guest review */
  setReviewStatus(id: string, status: ReviewStatus) {
    this.reviews.update(list =>
      list.map(r => (r.id === id ? { ...r, status } : r))
    );
    this.saveReviews();
  }

  /** Permanently delete a guest review */
  deleteReview(id: string) {
    this.reviews.update(list => list.filter(r => r.id !== id));
    this.saveReviews();
  }

  /** Add a custom RAG knowledge document from the Admin Panel */
  addRagDoc(title: string, category: string, content: string, keywordsRaw = '') {
    const maxNum = this.ragDocs().reduce((max, d) => {
      const num = parseInt(d.id.replace(/\D/g, ''), 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const words = (title + ' ' + category + ' ' + keywordsRaw)
      .toLowerCase()
      .split(/[^a-z0-9\u0900-\u097f]+/)
      .filter(w => w.length > 2);

    const doc: RagKnowledgeDoc = {
      id: 'KB-' + (maxNum + 1),
      title: title.trim(),
      category: category.trim() || 'General',
      content: content.trim(),
      keywords: Array.from(new Set(words))
    };
    this.ragDocs.update(list => [doc, ...list]);
    this.saveRagDocs();
  }

  /** Delete a RAG knowledge document */
  deleteRagDoc(id: string) {
    this.ragDocs.update(list => list.filter(d => d.id !== id));
    this.saveRagDocs();
  }

  /** Save optional Gemini API Key for LLM-augmented RAG generation */
  saveGeminiApiKey(key: string) {
    this.geminiApiKey.set(key.trim());
    try { localStorage.setItem(GEMINI_KEY_STORAGE, key.trim()); } catch { /* ignore */ }
  }

  /**
   * ============================================================================
   * IN-BROWSER RAG ENGINE (Retrieval-Augmented Generation — No Backend Required)
   * ============================================================================
   */
  async askRag(question: string): Promise<RagAnswer> {
    const q = question.trim().toLowerCase();
    const activeRooms = this.rooms().filter(r => r.active);
    const freeTonight = this.freeRoomsTonight();
    const s = this.settings();

    // 1. Build live knowledge chunks from all project data
    const chunks: { title: string; keywords: string[]; text: string; link?: string; linkLabel?: string }[] = [];

    // Chunk A: Live Rooms & Pricing + Availability
    const roomsSummary = activeRooms
      .map(r => `${r.name} (₹${r.price}/night, max 2 guests, tags: ${r.tags.join(', ')})`)
      .join('; ');
    const freeNames = freeTonight.map(r => r.name).join(', ') || 'Currently fully booked tonight';
    chunks.push({
      title: 'Live Rooms, Pricing & Availability',
      keywords: ['room', 'rooms', 'price', 'cost', 'rate', 'tariff', 'stay', 'night', 'available', 'availability', 'free', 'book', 'booking', 'valley', 'garden', 'suite', 'कमरा', 'किराया', 'बुक'],
      text: `We have ${activeRooms.length} active rooms: ${roomsSummary}. Each room holds a maximum of 2 guests. Available tonight (${formatStayDate(this.today)}): ${freeNames}.`,
      link: '/book',
      linkLabel: 'Book a Room →'
    });

    // Chunk B: Temple Trips & Packages
    const activeTrips = this.trips().filter(t => t.active);
    const tripsSummary = activeTrips
      .map(t => `${t.title} (${t.days} Days, ₹${t.price}/person): ${t.desc}`)
      .join(' | ');
    chunks.push({
      title: 'Guided Temple Trip Packages (2, 5 & 7 Days)',
      keywords: ['trip', 'trips', 'package', 'packages', 'tour', 'yatra', 'itinerary', '2-day', '5-day', '7-day', 'days', 'temple', 'temples', 'trek', 'यात्रा', 'ट्रिप', 'पैकेज'],
      text: `We offer ${activeTrips.length} guided temple packages: ${tripsSummary}. Deeba Mandir and Binsar Mahadev require a 10 km trek on foot.`,
      link: '/trip/0',
      linkLabel: 'Explore Temple Trips →'
    });

    // Chunk C: Individual Garhwal Temples
    for (const t of Object.values(TEMPLES)) {
      chunks.push({
        title: `Temple Guide: ${t.name} (${t.nameHi})`,
        keywords: [
          t.name.toLowerCase(),
          ...t.name.toLowerCase().split(/\W+/),
          'temple',
          'mandir',
          'shrine',
          'darshan',
          'मंदिर'
        ],
        text: `${t.name} (${t.nameHi}): ${t.desc}`,
        link: '/trip/0',
        linkLabel: 'View Temple Trips →'
      });
    }

    // Chunk D: Check-in / Check-out, Contact & Cancellation Policy
    chunks.push({
      title: 'Homestay Timings, Contact & Policy',
      keywords: ['check-in', 'checkin', 'check-out', 'checkout', 'time', 'timing', 'cancel', 'cancellation', 'policy', 'refund', 'phone', 'contact', 'whatsapp', 'email', 'call', 'number', 'समय', 'संपर्क'],
      text: `Check-in time is ${s.checkInTime} and check-out time is ${s.checkOutTime}. Cancellation policy: ${s.cancellationPolicy}. Contact / WhatsApp: ${s.phone}, Email: ${s.email}, Address: ${s.address}.`
    });

    // Chunk E: Approved Guest Reviews
    const approvedRevs = this.reviews().filter(r => r.status === 'Approved');
    if (approvedRevs.length > 0) {
      const avg = (approvedRevs.reduce((acc, r) => acc + r.rating, 0) / approvedRevs.length).toFixed(1);
      chunks.push({
        title: `Guest Reviews (${avg}★ Rating)`,
        keywords: ['review', 'reviews', 'rating', 'feedback', 'guest', 'experience', 'good', 'समीक्षा'],
        text: `Raibar Homestay has a ${avg}★ rating from ${approvedRevs.length} approved guest review(s). Recent review by ${approvedRevs[0].name}: "${approvedRevs[0].text}"`
      });
    }

    // Chunk F: Custom Admin Knowledge Base Docs
    for (const doc of this.ragDocs()) {
      chunks.push({
        title: doc.title,
        keywords: [
          ...doc.keywords,
          ...doc.title.toLowerCase().split(/\W+/),
          ...doc.content.toLowerCase().split(/\W+/).filter(w => w.length > 3)
        ],
        text: doc.content
      });
    }

    // 2. RETRIEVE: Score chunks against the user query
    const queryWords = q.split(/[^a-z0-9\u0900-\u097f]+/).filter(w => w.length > 1);
    const scored = chunks
      .map(chunk => {
        let score = 0;
        for (const w of queryWords) {
          if (chunk.keywords.some(k => k.includes(w) || w.includes(k))) score += 3;
          if (chunk.title.toLowerCase().includes(w)) score += 2;
          if (chunk.text.toLowerCase().includes(w)) score += 1;
        }
        return { chunk, score };
      })
      .sort((a, b) => b.score - a.score);

    const topChunks = scored.filter(s => s.score > 0).slice(0, 3).map(s => s.chunk);
    const retrieved = topChunks.length > 0 ? topChunks : [chunks[0], chunks[1]];
    const sources = retrieved.map(c => c.title);
    const primaryLink = retrieved.find(c => c.link);

    // 3. GENERATE: Smart calculation if user mentions guest count or nights
    let calcNote = '';
    const guestMatch = q.match(/(\d+)\s*(?:guest|guests|people|person|persons|log|member|members|मेहमान|लोग)/);
    const nightMatch = q.match(/(\d+)\s*(?:night|nights|day|days|दिन|रात)/);
    if (guestMatch) {
      const gCount = Math.max(1, parseInt(guestMatch[1], 10));
      const nCount = nightMatch ? Math.max(1, parseInt(nightMatch[1], 10)) : 1;
      const roomsNeeded = Math.min(activeRooms.length || 1, Math.ceil(gCount / 2));
      const pickedRooms = activeRooms.slice(0, roomsNeeded);
      const nightlySum = pickedRooms.reduce((sum, r) => sum + r.price, 0);
      const totalCost = nightlySum * nCount;
      const roomNames = pickedRooms.map(r => r.name).join(' + ');
      calcNote =
        `For ${gCount} guest(s) (max 2 guests per room), you will need ${roomsNeeded} room(s) (${roomNames}). ` +
        `For ${nCount} night(s), the total room cost is ₹${totalCost.toLocaleString('en-IN')} (₹${nightlySum.toLocaleString('en-IN')}/night).`;
    }

    // Optional: If owner configured a Gemini API key in Admin, call Gemini 1.5 Flash with the retrieved context
    const apiKey = this.geminiApiKey();
    if (apiKey) {
      try {
        const contextBlock = retrieved.map(c => `[${c.title}]: ${c.text}`).join('\n');
        const prompt =
          `You are the official AI Concierge for Raibar Homestay in Pauri Garhwal, Uttarakhand.\n` +
          `Answer the guest's question concisely (2-4 sentences) using ONLY the following retrieved context:\n` +
          `${contextBlock}\n` +
          (calcNote ? `Calculated Pricing Note: ${calcNote}\n` : '') +
          `Guest Question: ${question}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );
        if (res.ok) {
          const data = await res.json();
          const llmText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (llmText) {
            return {
              answer: llmText.trim(),
              sources,
              actionLink: primaryLink?.link ?? '/book',
              actionLabel: primaryLink?.linkLabel ?? 'Book Your Stay →'
            };
          }
        }
      } catch {
        // Fall back to built-in local RAG synthesis below
      }
    }

    // Built-in Local RAG Synthesizer (works 100% offline without any API key)
    const synthesized =
      (calcNote ? calcNote + '\n\n' : '') +
      retrieved.map(c => `• ${c.title}: ${c.text}`).join('\n\n');

    return {
      answer: synthesized,
      sources,
      actionLink: primaryLink?.link ?? '/book',
      actionLabel: primaryLink?.linkLabel ?? 'Book Your Stay →'
    };
  }

  /** Save owner business settings */
  saveSettings(next: BusinessSettings) {
    this.settings.set({ ...next });
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings())); } catch { /* ignore */ }
  }

  /** Reset mock data back to the initial seed state */
  resetDemoData() {
    this.rooms.set(structuredClone(SEED_ROOMS));
    this.bookings.set(buildSeedBookings());
    this.trips.set(buildSeedTrips());
    this.tripBookings.set(buildSeedTripBookings());
    this.content.set(buildSeedContent());
    this.reviews.set(buildSeedReviews());
    this.settings.set(buildSeedSettings());
    this.ragDocs.set(structuredClone(SEED_RAG_DOCS));
    this.saveRooms();
    this.saveBookings();
    this.saveTrips();
    this.saveTripBookings();
    this.saveContent();
    this.saveReviews();
    this.saveRagDocs();
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings())); } catch { /* ignore */ }
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

  private loadTrips(): AdminTrip[] {
    try {
      const raw = localStorage.getItem(TRIPS_KEY);
      return raw ? JSON.parse(raw) : buildSeedTrips();
    } catch {
      return buildSeedTrips();
    }
  }

  private loadTripBookings(): AdminTripBooking[] {
    try {
      const raw = localStorage.getItem(TRIP_BOOKINGS_KEY);
      return raw ? JSON.parse(raw) : buildSeedTripBookings();
    } catch {
      return buildSeedTripBookings();
    }
  }

  private loadContent(): SiteContent {
    try {
      const raw = localStorage.getItem(CONTENT_KEY);
      return raw ? JSON.parse(raw) : buildSeedContent();
    } catch {
      return buildSeedContent();
    }
  }

  private loadReviews(): AdminReview[] {
    try {
      const raw = localStorage.getItem(REVIEWS_KEY);
      return raw ? JSON.parse(raw) : buildSeedReviews();
    } catch {
      return buildSeedReviews();
    }
  }

  private loadSettings(): BusinessSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : buildSeedSettings();
    } catch {
      return buildSeedSettings();
    }
  }

  private loadRagDocs(): RagKnowledgeDoc[] {
    try {
      const raw = localStorage.getItem(RAG_DOCS_KEY);
      return raw ? JSON.parse(raw) : structuredClone(SEED_RAG_DOCS);
    } catch {
      return structuredClone(SEED_RAG_DOCS);
    }
  }

  private loadGeminiKey(): string {
    try {
      return localStorage.getItem(GEMINI_KEY_STORAGE) ?? '';
    } catch {
      return '';
    }
  }

  private saveRooms() {
    try { localStorage.setItem(ROOMS_KEY, JSON.stringify(this.rooms())); } catch { /* ignore */ }
  }

  private saveBookings() {
    try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(this.bookings())); } catch { /* ignore */ }
  }

  private saveTrips() {
    try { localStorage.setItem(TRIPS_KEY, JSON.stringify(this.trips())); } catch { /* ignore */ }
  }

  private saveTripBookings() {
    try { localStorage.setItem(TRIP_BOOKINGS_KEY, JSON.stringify(this.tripBookings())); } catch { /* ignore */ }
  }

  private saveContent() {
    try { localStorage.setItem(CONTENT_KEY, JSON.stringify(this.content())); } catch { /* ignore */ }
  }

  private saveReviews() {
    try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(this.reviews())); } catch { /* ignore */ }
  }

  private saveRagDocs() {
    try { localStorage.setItem(RAG_DOCS_KEY, JSON.stringify(this.ragDocs())); } catch { /* ignore */ }
  }
}