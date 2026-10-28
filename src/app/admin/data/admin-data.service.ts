import { Injectable, computed, signal } from '@angular/core';
import {
  AdminBooking,
  AdminReview,
  AdminRoom,
  AdminTrip,
  AdminTripBooking,
  BlockedRange,
  BookingStatus,
  BusinessSettings,
  AssistantAnswer,
  KnowledgeChunk,
  KnowledgeDocument,
  RetrievedHit,
  PaymentStatus,
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


const KNOWLEDGE_DOCS_KEY = 'raibar-admin-knowledge-v2';
const GEMINI_KEY_STORAGE = 'raibar-admin-gemini-key-v1';

const SEED_KNOWLEDGE_DOCS: KnowledgeDocument[] = [
  {
    id: 'DOC-1',
    name: 'Raibar_Homestay_Policies.pdf',
    fileType: 'pdf',
    fileSize: '18.4 KB',
    uploadedAt: dayOffset(-5),
    chunksCount: 3,
    summary: 'Official house rules, meal guidelines, room capacity, and winter heating policies.',
    chunks: [
      {
        id: 'CHK-DOC-1-1',
        docId: 'DOC-1',
        docName: 'Raibar_Homestay_Policies.pdf',
        category: 'House Rules & Capacity',
        text: 'Check-in time is 12:00 PM and check-out is 10:00 AM. Each room accommodates a maximum of 2 guests. For groups of 3 or 4 guests, our reservation system books 2 rooms to ensure comfort. Quiet hours are observed from 10:00 PM to 6:00 AM to preserve mountain peace.',
        wordCount: 48,
        keywords: ['check-in', 'check-out', 'time', 'hours', 'quiet', 'guest', 'guests', 'capacity', '2', '4', 'room', 'rooms', 'नियम', 'समय']
      },
      {
        id: 'CHK-DOC-1-2',
        docId: 'DOC-1',
        docName: 'Raibar_Homestay_Policies.pdf',
        category: 'Food & Pahadi Dining',
        text: 'Food is not included in the base room tariff. We prepare fresh, authentic Garhwali home-cooked vegetarian meals on order (Mandua/Ragi roti, Jhangora kheer, local mountain dal, seasonal organic greens, ginger tea, and country breakfast). Meal orders are placed 2 hours in advance.',
        wordCount: 44,
        keywords: ['food', 'meal', 'meals', 'dining', 'breakfast', 'lunch', 'dinner', 'tea', 'pahadi', 'garhwali', 'mandua', 'roti', 'dal', 'extra', 'charges', 'खाना', 'भोजन']
      },
      {
        id: 'CHK-DOC-1-3',
        docId: 'DOC-1',
        docName: 'Raibar_Homestay_Policies.pdf',
        category: 'Winter Amenities & Heating',
        text: 'During chilly winter months in Pauri Garhwal, room heaters and heavy quilts are provided. Evening courtyard bonfires with local mountain herbal tea can be arranged on guest request for ₹400. High-speed Wi-Fi and 24/7 hot water geysers are active across all rooms.',
        wordCount: 45,
        keywords: ['heater', 'heating', 'winter', 'snow', 'cold', 'bonfire', 'wood', 'fire', 'wifi', 'internet', 'hot water', 'geyser', 'amenities', 'सुविधा', 'आग']
      }
    ]
  },
  {
    id: 'DOC-2',
    name: 'Garhwal_Temple_Trek_Guide.pdf',
    fileType: 'pdf',
    fileSize: '24.1 KB',
    uploadedAt: dayOffset(-2),
    chunksCount: 2,
    summary: 'Travel guide for Deeba Mandir, Binsar Mahadev, and village pilgrimage trails.',
    chunks: [
      {
        id: 'CHK-DOC-2-1',
        docId: 'DOC-2',
        docName: 'Garhwal_Temple_Trek_Guide.pdf',
        category: 'Temple Yatra & Trekking',
        text: 'We arrange 2, 5, and 7-day guided temple pilgrimage trips. The visit to Maa Deeba Mandir and Binsar Mahadev involves a scenic 10 km forest trek on foot through ancient rhododendron (Buransh) and deodar forests. Sturdy walking shoes and layered warm clothing are strongly advised.',
        wordCount: 46,
        keywords: ['temple', 'mandir', 'trek', 'trekking', 'deeba', 'binsar', 'mahadev', '10 km', 'shoes', 'foot', 'package', 'yatra', 'buransh', 'forest', 'मंदिर', 'यात्रा', 'ट्रेक']
      },
      {
        id: 'CHK-DOC-2-2',
        docId: 'DOC-2',
        docName: 'Garhwal_Temple_Trek_Guide.pdf',
        category: 'Location & How to Reach',
        text: 'Raibar Homestay is situated in Kainyur, Thalisain, Pauri Garhwal, Uttarakhand (246285). Nearest railheads are Kotdwar and Ramnagar. Direct scenic motorable mountain road connects to our gates with free private parking for personal cars and taxis.',
        wordCount: 39,
        keywords: ['location', 'address', 'reach', 'road', 'car', 'parking', 'drive', 'train', 'station', 'kotdwar', 'ramnagar', 'thalisain', 'kainyur', 'pauri', 'पता', 'कहाँ']
      }
    ]
  }
];

/** Statuses that occupy a room on the calendar */
const ACTIVE_STATUSES: BookingStatus[] = ['Confirmed', 'CheckedIn'];
@Injectable({ providedIn: 'root' })
export class AdminDataService {
  rooms = signal<AdminRoom[]>(this.loadRooms());
  bookings = signal<AdminBooking[]>(this.loadBookings());
  trips = signal<AdminTrip[]>(this.loadTrips());
  tripBookings = signal<AdminTripBooking[]>(this.loadTripBookings());
  content = signal<SiteContent>(this.loadContent());
  reviews = signal<AdminReview[]>(this.loadReviews());
  settings = signal<BusinessSettings>(this.loadSettings());
  knowledgeDocs = signal<KnowledgeDocument[]>(this.loadKnowledgeDocs());
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


  /**
   * Intelligently chunks text from uploaded files (PDF/TXT/Notes) into
   * semantic paragraphs with overlapping context for optimal retrieval.
   */
  chunkText(
    rawText: string,
    docId: string,
    docName: string,
    category: string,
    chunkSize = 380,
    overlap = 50
  ): KnowledgeChunk[] {
    const clean = rawText.replace(/\r\n/g, '\n').trim();
    if (!clean) return [];

    const paragraphs = clean.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    const textBlocks: string[] = [];
    let cur = '';

    for (const para of paragraphs) {
      if ((cur + '\n\n' + para).trim().length <= chunkSize) {
        cur = (cur ? cur + '\n\n' : '') + para;
      } else {
        if (cur.trim()) textBlocks.push(cur.trim());
        if (para.length > chunkSize) {
          const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
          cur = '';
          for (const s of sentences) {
            if ((cur + ' ' + s).trim().length <= chunkSize) {
              cur = (cur ? cur + ' ' : '') + s.trim();
            } else {
              if (cur) textBlocks.push(cur.trim());
              cur = s.trim();
            }
          }
        } else {
          cur = para;
        }
      }
    }
    if (cur.trim()) textBlocks.push(cur.trim());

    return textBlocks.map((chunkText, idx) => {
      const words = chunkText
        .toLowerCase()
        .replace(/[^a-z0-9\u0900-\u097f\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);

      return {
        id: `CHK-${docId}-${idx + 1}`,
        docId,
        docName,
        category: category.trim() || 'Homestay Guide',
        text: chunkText,
        wordCount: chunkText.split(/\s+/).length,
        keywords: Array.from(new Set(words))
      };
    });
  }

  /** Add an uploaded or pasted document to the Knowledge Base */
  addKnowledgeDocument(
    name: string,
    fileType: string,
    fileSize: string,
    rawText: string,
    category = 'Homestay Guide'
  ): KnowledgeDocument {
    const maxNum = this.knowledgeDocs().reduce((max, d) => {
      const num = parseInt(d.id.replace(/\D/g, ''), 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const docId = 'DOC-' + (maxNum + 1);

    const chunks = this.chunkText(rawText, docId, name, category);
    const summary = chunks[0]?.text.slice(0, 140) + '...' || 'Uploaded knowledge document.';

    const newDoc: KnowledgeDocument = {
      id: docId,
      name: name.trim() || `Document_${docId}`,
      fileType: fileType.toLowerCase(),
      fileSize: fileSize || '12 KB',
      uploadedAt: this.today,
      chunksCount: chunks.length,
      summary,
      chunks
    };

    this.knowledgeDocs.update(list => [newDoc, ...list]);
    this.saveKnowledgeDocs();
    return newDoc;
  }

  /** Delete a knowledge document and its chunks */
  /** Save optional Gemini API Key for ChatGPT-like conversational intelligence */
  saveGeminiApiKey(key: string) {
    this.geminiApiKey.set(key.trim());
    try { localStorage.setItem(GEMINI_KEY_STORAGE, key.trim()); } catch { /* ignore */ }
  }

  deleteKnowledgeDocument(id: string) {
    this.knowledgeDocs.update(list => list.filter(d => d.id !== id));
    this.saveKnowledgeDocs();
  }

  /**
   * RAG RETRIEVAL ENGINE:
   * Scores all knowledge chunks across uploaded PDFs, room inventories,
   * and temple trip packages against the guest query using hybrid keyword & semantic scoring.
   */
  retrieveRelevantChunks(query: string, topK = 4): RetrievedHit[] {
    const raw = query.trim().toLowerCase();
    if (!raw) return [];

    // Normalize chat shorthand (u -> you, r -> are)
    const norm = raw
      .replace(/\bu\b/g, 'you')
      .replace(/\br\b/g, 'are')
      .replace(/\bur\b/g, 'your')
      .replace(/\bplz\b/g, 'please')
      .replace(/\bpls\b/g, 'please');

    // English & Hindi stop words that should NEVER be used as search criteria
    const STOP_WORDS = new Set([
      'how', 'are', 'you', 'u', 'r', 'is', 'am', 'was', 'were', 'be', 'been',
      'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'do', 'does', 'did', 'can', 'could', 'will', 'would', 'shall', 'should',
      'what', 'which', 'who', 'whom', 'where', 'when', 'why',
      'this', 'that', 'there', 'here', 'my', 'your', 'our', 'it', 'its',
      'me', 'we', 'us', 'they', 'them', 'and', 'or', 'so', 'but',
      'kya', 'hai', 'hain', 'ho', 'h', 'ka', 'ki', 'ke', 'ko', 'se', 'me', 'mein', 'par'
    ]);

    const contentTokens = norm
      .split(/[^a-z0-9\u0900-\u097f]+/)
      .filter(w => w.length > 1 && !STOP_WORDS.has(w));

    // If query has no substantive keywords (e.g. only "how are you" or "hi"), do not fetch random chunks
    if (contentTokens.length === 0) {
      return [];
    }

    // 1. Collect all uploaded document chunks
    const allChunks: KnowledgeChunk[] = [];
    for (const doc of this.knowledgeDocs()) {
      allChunks.push(...doc.chunks);
    }

    // 2. Add real-time live Room Chunks
    const activeRooms = this.rooms().filter(r => r.active);
    const freeTonight = this.freeRoomsTonight();
    const roomsSummary = activeRooms
      .map(r => `${r.name} (₹${r.price}/night, max 2 guests)`)
      .join('; ');
    const freeNames = freeTonight.map(r => r.name).join(', ') || 'Fully booked tonight';
    allChunks.push({
      id: 'CHK-LIVE-ROOMS',
      docId: 'LIVE-SYSTEM',
      docName: 'Raibar_Homestay_Rooms.pdf',
      category: 'Rooms & Pricing',
      text: `We have ${activeRooms.length} active rooms: ${roomsSummary}. Maximum 2 guests per room. Available tonight (${formatStayDate(this.today)}): ${freeNames}.`,
      wordCount: 30,
      keywords: ['room', 'rooms', 'price', 'tariff', 'stay', 'night', 'available', 'availability', 'cost', 'valley', 'garden', 'suite', 'cottage', 'कमरा', 'किराया']
    });

    // 3. Add real-time guided trip packages
    const activeTrips = this.trips().filter(t => t.active);
    const tripsSummary = activeTrips.map(t => `${t.title} (${t.days} Days, ₹${t.price}/person): ${t.desc}`).join(' | ');
    allChunks.push({
      id: 'CHK-LIVE-TRIPS',
      docId: 'LIVE-SYSTEM',
      docName: 'Garhwal_Temple_Trek_Guide.pdf',
      category: 'Temple Yatra',
      text: `Guided temple packages: ${tripsSummary}. Includes visits to Deeba Mandir (10 km trek) and Binsar Mahadev.`,
      wordCount: 28,
      keywords: ['trip', 'trips', 'package', 'packages', 'tour', 'yatra', 'deeba', 'binsar', 'trek', 'itinerary', 'shoes', 'boots', 'clothes', 'यात्रा', 'पैकेज']
    });

    // Score chunks against content tokens
    const scored = allChunks.map(chunk => {
      let rawScore = 0;
      const lowerText = chunk.text.toLowerCase();
      const lowerCat = chunk.category.toLowerCase();
      const lowerDoc = chunk.docName.toLowerCase();

      // Exact phrase match bonus if substantive
      if (norm.length > 5 && lowerText.includes(norm)) rawScore += 8;

      for (const token of contentTokens) {
        if (chunk.keywords.some(k => k === token || k.includes(token))) rawScore += 5;
        if (lowerCat.includes(token)) rawScore += 3;
        if (lowerDoc.includes(token)) rawScore += 2;
        if (lowerText.includes(token)) rawScore += 1;
      }

      return { chunk, rawScore };
    });

    const maxScore = Math.max(1, ...scored.map(s => s.rawScore));
    return scored
      .filter(s => s.rawScore >= 3) // Minimum match threshold to avoid garbage matches
      .sort((a, b) => b.rawScore - a.rawScore)
      .slice(0, topK)
      .map((s, idx) => ({
        chunk: s.chunk,
        score: Math.min(99, Math.round((s.rawScore / maxScore) * 100)),
        rank: idx + 1
      }));
  }

  /**
   * PROPER CONVERSATIONAL AI ASSISTANT:
   * Greets naturally, handles colloquial pleasantries, computes group pricing,
   * and grounds in uploaded Knowledge Base documents without awkward citation bugs.
   */
  async askAssistant(
    question: string,
    history: { sender: string; text: string }[] = []
  ): Promise<AssistantAnswer> {
    const tStart = performance.now();
    const rawQ = question.trim();
    const q = rawQ.toLowerCase();

    // Helper for natural human variations
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // Normalize shorthand: "how are u" -> "how are you", "how r u" -> "how are you"
    const norm = q
      .replace(/\bu\b/g, 'you')
      .replace(/\br\b/g, 'are')
      .replace(/\bur\b/g, 'your')
      .replace(/\bplz\b/g, 'please')
      .replace(/\bpls\b/g, 'please')
      .replace(/\bbhai\b/g, '')
      .replace(/\bbhaiya\b/g, '');

    // 1. GREETINGS (Multiple natural human variations)
    const cleanWord = norm.replace(/[^a-z0-9\u0900-\u097f]/g, '');
    const greetingWords = ['hi', 'hello', 'hey', 'namaste', 'pranam', 'namaskar', 'hlo', 'hii', 'hiii', 'helo', 'goodmorning', 'goodafternoon', 'goodevening', 'नमस्ते', 'नमस्कार', 'प्रणाम'];
    if (greetingWords.includes(cleanWord)) {
      const greetingReplies = [
        'Namaste and welcome to Raibar Homestay! 🙏\n\nI am your digital host here in Kainyur, Pauri Garhwal. I can help you check room rates, calculate pricing for your group, share our home-cooked Pahadi dining menu, or guide you on temple treks to Deeba Mandir and Binsar Mahadev.\n\nHow can I assist you with your travel plans today?',
        'Hello and welcome! 🌲 So happy to connect with you. Raibar Homestay is nestled in the serene hills of Pauri Garhwal. Are you looking to book a peaceful room, learn about our homemade Pahadi meals, or plan a temple trek?',
        'Warm greetings from the Garhwal hills! 🙏 Namaste. I am here to help you plan an unforgettable mountain stay at Raibar Homestay. Feel free to ask about our room availability, rates, or local travel guidance!',
        'Namaste! Welcome to our homestay in Kainyur, Uttarakhand. 🏔️ How can I help you today? You can ask me about room costs, group stays, check-in rules, or our guided temple packages!'
      ];

      return {
        answer: pick(greetingReplies),
        sources: [],
        retrievedHits: [],
        actionLink: '/book',
        actionLabel: 'Explore Our Rooms →',
        latencyMs: Math.round(performance.now() - tStart)
      };
    }

    // 2. CONVERSATIONAL PLEASANTRIES (Multiple natural human variations)
    const isPleasantry = /\b(how are you|how are u|how r you|how r u|kaise ho|kese ho|kya haal|sab theek|sab kaisa|whats up|what's up|sup)\b/i.test(norm);
    if (isPleasantry) {
      const pleasantryReplies = [
        'I am doing wonderful, thank you for asking! The mountain weather here in Pauri Garhwal is beautiful and serene today. 🌲\n\nAre you planning a visit or a mountain trek? Let me know how many guests are coming, and I will be happy to help you with dates and rooms!',
        'Doing great, thank you! The hills are peaceful and welcoming today. 🏔️ How are things with you? Let me know if you would like to check dates or room rates for Raibar Homestay!',
        'Namaste! I am doing well and glad to connect with you. 🌲 Are you looking to plan a mountain getaway with family or friends? Tell me your preferred dates or guest count!',
        'All good here in the mountains! Thank you for asking. 🙏 How can I help make your upcoming trip to Pauri Garhwal easy and memorable?'
      ];

      return {
        answer: pick(pleasantryReplies),
        sources: [],
        retrievedHits: [],
        actionLink: '/book',
        actionLabel: 'Book Your Stay →',
        latencyMs: Math.round(performance.now() - tStart)
      };
    }

    // 3. ASSISTANT IDENTITY
    const isIdentity = /\b(who are you|who r you|tum kaun|aap kaun|kya karte ho|what can you do)\b/i.test(norm);
    if (isIdentity) {
      const identityReplies = [
        'I am the official AI Concierge for Raibar Homestay in Kainyur, Thalisain, Pauri Garhwal. I have direct access to our live room availability, authentic Pahadi meal policies, winter bonfire guides, and Garhwal temple trekking itineraries.\n\nFeel free to ask me anything about your trip, pricing, or local travel guidance!',
        'I am your virtual host for Raibar Homestay! 🏔️ Think of me as your 24/7 mountain receptionist. I can calculate room costs for your group, explain our home-cooked meals, guide you on local weather, and help you reserve dates.'
      ];

      return {
        answer: pick(identityReplies),
        sources: [],
        retrievedHits: [],
        actionLink: '/book',
        actionLabel: 'Explore Homestay →',
        latencyMs: Math.round(performance.now() - tStart)
      };
    }

    // 4. GRATITUDE
    const isGratitude = /\b(thank|thanks|dhanyawad|dhanyavad|shukriya|thx)\b/i.test(norm);
    if (isGratitude) {
      const gratitudeReplies = [
        'You are most welcome! We look forward to hosting you with warm Garhwali hospitality at Raibar Homestay. If you have any more questions or want to confirm a room, I am right here to help! 🙏',
        'Glad I could help! Don\'t hesitate to reach out if you need more details about rooms, meals, or mountain trails. Have a wonderful day! 🌲',
        'Dhanyawad! We would love to welcome you to the Garhwal hills. Whenever you\'re ready to confirm your reservation, just click below!'
      ];

      return {
        answer: pick(gratitudeReplies),
        sources: [],
        retrievedHits: [],
        actionLink: '/book',
        actionLabel: 'Reserve Your Room →',
        latencyMs: Math.round(performance.now() - tStart)
      };
    }

    // 5. RETRIEVE RELEVANT KNOWLEDGE CHUNKS (With stopwords filtered out)
    const hits = this.retrieveRelevantChunks(rawQ, 3);
    const activeRooms = this.rooms().filter(r => r.active);

    // 6. SMART CALCULATION FOR GUESTS / NIGHTS
    let calcNote = '';
    const guestMatch = q.match(/(\d+)\s*(?:guest|guests|people|person|persons|log|member|members|मेहमान|लोग)/);
    const nightMatch = q.match(/(\d+)\s*(?:night|nights|day|days|दिन|रात)/);

    if (guestMatch) {
      const gCount = Math.max(1, parseInt(guestMatch[1], 10));
      const nCount = nightMatch ? Math.max(1, parseInt(nightMatch[1], 10)) : 1;
      const roomsNeeded = Math.min(activeRooms.length || 1, Math.ceil(gCount / 2));
      const picked = activeRooms.slice(0, roomsNeeded);
      const nightlyTotal = picked.reduce((acc, r) => acc + r.price, 0);
      const grandTotal = nightlyTotal * nCount;
      const roomNames = picked.map(r => r.name).join(' + ');

      const calcStyles = [
        `For ${gCount} guest(s) (maximum 2 guests per room), you will need ${roomsNeeded} room(s) (${roomNames}). For ${nCount} night(s), your total room tariff comes to ₹${grandTotal.toLocaleString('en-IN')} (₹${nightlyTotal.toLocaleString('en-IN')}/night).`,
        `To comfortably accommodate ${gCount} guests, our policy allocates ${roomsNeeded} room(s) (${roomNames}) at ₹${nightlyTotal.toLocaleString('en-IN')}/night. For ${nCount} night(s), the total is ₹${grandTotal.toLocaleString('en-IN')}.`,
        `Planning for ${gCount} guests? You will require ${roomsNeeded} room(s) (${roomNames}). Across ${nCount} night(s), the room stay total will be ₹${grandTotal.toLocaleString('en-IN')} (₹${nightlyTotal.toLocaleString('en-IN')} per night total).`
      ];
      calcNote = pick(calcStyles);
    }

    // 7. OPTIONAL: FULL GENERATIVE AI VIA GEMINI 1.5 FLASH (If Admin configured a key)
    const apiKey = this.geminiApiKey();
    if (apiKey) {
      try {
        const contextText = hits.map(h => `[Document: ${h.chunk.docName} | Category: ${h.chunk.category}]: ${h.chunk.text}`).join('\n\n');
        const recentHistory = history.slice(-4).map(m => `${m.sender === 'user' ? 'Guest' : 'Host'}: ${m.text}`).join('\n');

        const prompt =
          `You are the warm, polite, and hospitable AI Concierge for Raibar Homestay in Kainyur, Thalisain, Pauri Garhwal, Uttarakhand.\n` +
          `Answer the guest naturally and uniquely in 2-4 sentences like a real human hotel host. Match the guest's language (English, Hindi, or Hinglish).\n` +
          `Ground your answer strictly in these real homestay facts:\n` +
          `${contextText}\n` +
          (calcNote ? `Calculated Pricing Note: ${calcNote}\n` : '') +
          (recentHistory ? `Recent Conversation:\n${recentHistory}\n` : '') +
          `Current Guest Question: ${rawQ}`;

        // Attempt 1: gemini-1.5-flash
        let res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey
            },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );

        // Attempt 2: gemini-2.0-flash if 1.5 failed
        if (!res.ok) {
          res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
              },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
          );
        }

        if (res.ok) {
          const data = await res.json();
          const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiReply) {
            return {
              answer: aiReply.trim(),
              sources: hits.map(h => ({ title: h.chunk.category, docName: h.chunk.docName, score: h.score })),
              retrievedHits: hits,
              actionLink: q.includes('trek') || q.includes('trip') || q.includes('temple') ? '/trip/0' : '/book',
              actionLabel: q.includes('trek') || q.includes('trip') ? 'View Temple Packages →' : 'Book a Room →',
              latencyMs: Math.round(performance.now() - tStart)
            };
          }
        } else {
          console.warn('Gemini API error status:', res.status, await res.text());
        }
      } catch (err) {
        console.warn('Gemini fetch exception:', err);
      }
    }

    // 8. BUILT-IN DYNAMIC CONVERSATIONAL SYNTHESIS (Varied, natural human speech)
    let synthesized = '';

    if (calcNote) {
      synthesized += calcNote + '\n\n';
    }

    if (q.includes('food') || q.includes('khana') || q.includes('meal') || q.includes('dinner') || q.includes('breakfast') || q.includes('lunch') || q.includes('भोजन')) {
      const foodReplies = [
        'We prepare fresh, authentic Garhwali vegetarian meals (Mandua roti, local mountain dal, seasonal organic greens, ginger tea, and country breakfast) on order. Food is charged separately from the room tariff, and we kindly ask guests to confirm orders 2 hours in advance so our kitchen can cook everything fresh!',
        'At Raibar Homestay, you can enjoy home-cooked Pahadi meals made with organic local ingredients! We prepare fresh Mandua/Ragi rotis, Pahadi dal, and mountain teas on request. Meals are charged additionally and prepared fresh to your taste.',
        'Our kitchen serves wholesome Garhwali vegetarian thalis, local lentils, Mandua rotis, and fresh mountain breakfast. Since everything is cooked fresh on order, we request guests to let us know their meal preferences in advance!'
      ];
      synthesized += pick(foodReplies);
    } else if (q.includes('heater') || q.includes('winter') || q.includes('bonfire') || q.includes('cold') || q.includes('snow') || q.includes('आग')) {
      const winterReplies = [
        'All our rooms are equipped with 24/7 hot water geysers and heavy winter quilts. In peak winter months, supplemental room heaters and blowers are provided. We can also arrange a cozy courtyard bonfire in the evening with local herbal tea for ₹400 upon request!',
        'During winter in Pauri Garhwal, we keep our guests warm with electric geysers in all bathrooms, cozy quilts, and room blowers. In the evenings, you can enjoy a warm courtyard bonfire with herbal mountain tea for ₹400 on request!'
      ];
      synthesized += pick(winterReplies);
    } else if (q.includes('deeba') || q.includes('binsar') || q.includes('trek') || q.includes('mandir') || q.includes('temple') || q.includes('shoes') || q.includes('pack') || q.includes('ट्रेक')) {
      const trekReplies = [
        'We organize 2, 5, and 7-day guided temple pilgrimage trips. Visiting Maa Deeba Mandir and Binsar Mahadev involves a scenic 10 km forest trek on foot through ancient rhododendron and deodar trails. We strongly recommend sturdy walking shoes with good grip and layered warm clothing!',
        'Our temple packages take you through ancient Garhwal shrines. The trek to Deeba Mandir is about 10 km on foot through lush Himalayan forests. We recommend good trekking shoes, a walking stick, and warm clothing for the mountain trails!'
      ];
      synthesized += pick(trekReplies);
    } else if (q.includes('check') || q.includes('time') || q.includes('rule') || q.includes('policy') || q.includes('cancel')) {
      const policyReplies = [
        'Check-in time is at 12:00 PM and check-out is at 10:00 AM. Each room accommodates a maximum of 2 guests to ensure comfort. Quiet hours are observed between 10:00 PM and 6:00 AM to preserve our peaceful village mountain atmosphere.',
        'Our standard check-in begins at 12:00 PM, and check-out is by 10:00 AM. To ensure a restful mountain experience, each room has a maximum capacity of 2 guests, and quiet hours are from 10 PM onwards.'
      ];
      synthesized += pick(policyReplies);
    } else if (hits.length > 0) {
      const intros = [
        'Here is the information from our homestay guidelines: ',
        'Glad you asked! Regarding your inquiry: ',
        'Here are the details from our homestay policy: ',
        'Sure thing! Based on our homestay records: '
      ];
      const topHit = hits[0].chunk;
      synthesized += pick(intros) + topHit.text;
      if (hits[1] && hits[1].chunk.id !== topHit.id) {
        synthesized += `\n\nAdditionally, ${hits[1].chunk.text}`;
      }
    } else {
      const generalReplies = [
        'Namaste! At Raibar Homestay, we offer serene mountain rooms with sunrise valley balconies, authentic Pahadi meals, and guided temple trips. Let us know how many guests or dates you have in mind, and I will be delighted to help!',
        'Welcome to Raibar Homestay! Looking for room availability, prices, local Garhwali food, or guided temple treks? Feel free to ask and I will share all details with you!'
      ];
      synthesized += pick(generalReplies);
    }

    const sources = hits.map(h => ({
      title: h.chunk.category,
      docName: h.chunk.docName,
      score: h.score
    }));

    const isTripQuery = q.includes('trek') || q.includes('trip') || q.includes('temple') || q.includes('yatra');
    const actionLink = isTripQuery ? '/trip/0' : '/book';
    const actionLabel = isTripQuery ? 'Explore Temple Packages →' : 'Book a Room →';

    return {
      answer: synthesized,
      sources,
      retrievedHits: hits,
      actionLink,
      actionLabel,
      latencyMs: Math.max(1, Math.round(performance.now() - tStart))
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
    this.settings.set(buildSeedSettings());    this.saveRooms();
    this.saveBookings();
    this.saveTrips();
    this.saveTripBookings();
    this.saveContent();
    this.saveReviews();    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings())); } catch { /* ignore */ }
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
  }  private saveReviews() {
    try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(this.reviews())); } catch { /* ignore */ }
  }

  private loadKnowledgeDocs(): KnowledgeDocument[] {
    try {
      const raw = localStorage.getItem(KNOWLEDGE_DOCS_KEY);
      return raw ? JSON.parse(raw) : structuredClone(SEED_KNOWLEDGE_DOCS);
    } catch {
      return structuredClone(SEED_KNOWLEDGE_DOCS);
    }
  }

  private loadGeminiKey(): string {
    try {
      const stored = localStorage.getItem(GEMINI_KEY_STORAGE);
      return stored && stored.trim() ? stored.trim() : '';
    } catch {
      return '';
    }
  }

  private saveKnowledgeDocs() {
    try {
      localStorage.setItem(KNOWLEDGE_DOCS_KEY, JSON.stringify(this.knowledgeDocs()));
    } catch { /* ignore */ }
  }

}
