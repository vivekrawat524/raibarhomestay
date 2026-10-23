import { GALLERY, SITE } from '../../core/site.data';
import { AdminBooking, AdminReview, AdminRoom, AdminTrip, BusinessSettings, SiteContent } from './admin.models';

/** Helper to get YYYY-MM-DD offset by N days from today */
export function dayOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Initial 5 rooms (whole-room unit, fixed nightly price) */
export const SEED_ROOMS: AdminRoom[] = [
  {
    id: 1,
    name: 'Valley Facing Room',
    desc: 'Wake up to panoramic views of the Garhwal hills with a private sunrise balcony.',
    price: 1000,
    capacity: 2,
    img: 'images/p5.jpeg',
    tags: ['2 GUESTS', 'BALCONY', 'SUNRISE VIEW', 'WIFI', 'HOT WATER'],
    active: true,
    blockedDates: []
  },
  {
    id: 2,
    name: 'Garden Room',
    desc: 'Ground-floor room opening onto our peaceful garden sit-out.',
    price: 1000,
    capacity: 2,
    img: 'images/p6.png',
    tags: ['2 GUESTS', 'GARDEN SIT-OUT', 'MODERN', 'WIFI', 'HOT WATER'],
    active: true,
    blockedDates: []
  },
  {
    id: 3,
    name: 'Himalayan Sunrise Suite',
    desc: 'Spacious corner room with large windows facing the snow peaks and terrace access.',
    price: 1500,
    capacity: 3,
    img: 'images/p15.png',
    tags: ['3 GUESTS', 'MOUNTAIN VIEW', 'TERRACE', 'WIFI', 'HOT WATER'],
    active: true,
    blockedDates: []
  },
  {
    id: 4,
    name: 'Pine Forest View Room',
    desc: 'Quiet room overlooking deodar and pine trees, ideal for long restful stays.',
    price: 1200,
    capacity: 2,
    img: 'images/p16.png',
    tags: ['2 GUESTS', 'FOREST VIEW', 'QUIET', 'WIFI', 'HOT WATER'],
    active: true,
    blockedDates: []
  },
  {
    id: 5,
    name: 'Family Mountain Cottage',
    desc: 'Large family room with two double beds and private sit-out area for groups.',
    price: 1800,
    capacity: 4,
    img: 'images/p9.jpeg',
    tags: ['4 GUESTS', 'FAMILY ROOM', 'PRIVATE SIT-OUT', 'WIFI', 'HOT WATER'],
    active: true,
    blockedDates: []
  }
];

/** Initial 3 travel packages (2-day, 5-day and 7-day temple trips) */
export function buildSeedTrips(): AdminTrip[] {
  return [
    {
      id: 1,
      days: 2,
      title: '2-Day Road Trip',
      desc: 'Bhairokhal, Ardhnareshwar, Hanseshwar and Rahu Mandir by road, with Tarakund as an optional add-on.',
      price: 2999,
      img: 'images/p12.jpeg',
      fixedTemples: ['bh', 'ar', 'ha', 'ra'],
      optionalTemples: ['ta'],
      active: true,
      departures: [
        { id: 'DEP-1', date: dayOffset(3), capacity: 8, booked: 4 },
        { id: 'DEP-2', date: dayOffset(10), capacity: 8, booked: 0 }
      ]
    },
    {
      id: 2,
      days: 5,
      title: '5-Day Long Trip',
      desc: 'Bhairokhal, Ardhnareshwar, Tarakund and Rahu Mandir, with Deeba and Binsar Mahadev as optional treks.',
      price: 3999,
      img: 'images/p13.jpeg',
      fixedTemples: ['bh', 'ar', 'ta', 'ra'],
      optionalTemples: ['de', 'bi'],
      active: true,
      departures: [
        { id: 'DEP-3', date: dayOffset(5), capacity: 10, booked: 6 }
      ]
    },
    {
      id: 3,
      days: 7,
      title: '7-Day Grand Trip',
      desc: 'Bhairokhal, Ardhnareshwar, Tarakund, Rahu Mandir and Maa Kalinka, with Deeba and Binsar Mahadev as optional treks.',
      price: 4999,
      img: 'images/p10.jpeg',
      fixedTemples: ['bh', 'ar', 'ta', 'ra', 'ka'],
      optionalTemples: ['de', 'bi'],
      active: true,
      departures: [
        { id: 'DEP-4', date: dayOffset(7), capacity: 12, booked: 3 }
      ]
    }
  ];
}

/** Sample bookings relative to today so the dashboard always has realistic activity */
export function buildSeedBookings(): AdminBooking[] {
  const today = dayOffset(0);
  return [
    {
      id: 'BK-101',
      guestName: 'Amit Sharma',
      phone: '+919811122233',
      email: 'amit@example.com',
      guests: 2,
      roomId: 1,
      checkIn: today,
      checkOut: dayOffset(2),
      status: 'Confirmed',
      source: 'Website',
      note: 'Arriving around 2 PM',
      total: 2000,
      createdAt: dayOffset(-2)
    },
    {
      id: 'BK-102',
      guestName: 'Priya Rawat',
      phone: '+919822233344',
      guests: 2,
      roomId: 2,
      checkIn: dayOffset(-2),
      checkOut: today,
      status: 'CheckedIn',
      source: 'WhatsApp',
      note: 'Morning tea requested at 7 AM',
      total: 2000,
      createdAt: dayOffset(-5)
    },
    {
      id: 'BK-103',
      guestName: 'Rohan Negi',
      phone: '+919833344455',
      email: 'rohan@example.com',
      guests: 3,
      roomId: 3,
      checkIn: dayOffset(1),
      checkOut: dayOffset(4),
      status: 'Pending',
      source: 'Website',
      note: 'Interested in the 2-Day Road Trip as well',
      total: 4500,
      createdAt: today
    },
    {
      id: 'BK-104',
      guestName: 'Neha Joshi',
      phone: '+919844455566',
      guests: 4,
      roomId: 5,
      checkIn: dayOffset(3),
      checkOut: dayOffset(5),
      status: 'Pending',
      source: 'WhatsApp',
      total: 3600,
      createdAt: today
    }
  ];
}

/** Initial homepage text and gallery images */
export function buildSeedContent(): SiteContent {
  return {
    heroTagline: SITE.tagline,
    aboutHeading: 'A quiet home in the Garhwal hills',
    aboutText: 'Surrounded by deodar forests and sacred shrines, Raibar Homestay offers homemade Pahadi meals, warm hospitality, and guided temple journeys.',
    gallery: GALLERY.map((g, i) => ({ id: 'G-' + (i + 1), src: g.src, alt: g.alt }))
  };
}

/** Sample guest reviews for moderation */
export function buildSeedReviews(): AdminReview[] {
  return [
    {
      id: 'RV-1',
      name: 'Sandeep Bisht',
      rating: 5,
      stay: 'Homestay stay',
      text: 'Peaceful location, very clean rooms and delicious home-cooked Garhwali food!',
      date: dayOffset(-7),
      status: 'Approved'
    },
    {
      id: 'RV-2',
      name: 'Meera Nair',
      rating: 5,
      stay: '5-Day Long Trip',
      text: 'The Rahu Mandir and Tarakund trek arrangement was seamless. Highly recommended.',
      date: dayOffset(-1),
      status: 'Pending'
    }
  ];
}

/** Initial owner business settings */
export function buildSeedSettings(): BusinessSettings {
  return {
    name: SITE.name,
    tagline: SITE.tagline,
    phone: SITE.phone,
    whatsapp: SITE.whatsapp,
    email: SITE.email,
    address: SITE.address,
    instagram: SITE.instagram,
    facebook: SITE.facebook,
    checkInTime: '12:00 PM',
    checkOutTime: '10:00 AM',
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in.'
  };
}