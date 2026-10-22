import { AdminBooking, AdminRoom } from './admin.models';

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
    price: 1000,
    capacity: 2,
    img: 'images/p15.png',
    tags: ['2GUESTS', 'MOUNTAIN VIEW', 'TERRACE', 'WIFI', 'HOT WATER'],
    active: true,
    blockedDates: []
  },
  {
    id: 4,
    name: 'Pine Forest View Room',
    desc: 'Quiet room overlooking deodar and pine trees, ideal for long restful stays.',
    price: 1000,
    capacity:  2,
    img: 'images/p16.png',
    tags: ['2 GUESTS', 'FOREST VIEW', 'QUIET', 'WIFI', 'HOT WATER'],
    active: true,
    blockedDates: []
  },
  {
    id: 5,
    name: 'Family Mountain Cottage',
    desc: 'Large family room with two double beds and private sit-out area for groups.',
    price: 1000,
    capacity: 2,
    img: 'images/p9.jpeg',
    tags: ['2 GUESTS', 'FAMILY ROOM', 'PRIVATE SIT-OUT', 'WIFI', 'HOT WATER'],
    active: true,
    blockedDates: []
  }
];

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