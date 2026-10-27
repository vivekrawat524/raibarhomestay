import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminDataService } from '../../data/admin-data.service';
import {
  AdminBooking,
  AdminTripBooking,
  BookingStatus,
  countNights,
  formatStayDate
} from '../../data/admin.models';

/** A single day cell inside the top-left calendar grid */
export interface CalendarDay {
  ymd: string;          // YYYY-MM-DD
  dayNum: string;       // '01', '02', ...
  isToday: boolean;
  state: 'booked' | 'confirmed' | 'pending' | 'canceled' | 'free';
  count: number;
}

export interface ChartBarGroup {
  label: string;
  checkInHeight: number;  // 0..100 (%)
  checkOutHeight: number; // 0..100 (%)
  checkInCount: number;
  checkOutCount: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  data = inject(AdminDataService);

  /** Top Switcher: 'room' shows whole page for Room Bookings; 'trip' shows whole page for Trip Bookings */
  viewMode = signal<'room' | 'trip'>('room');

  /** Reservation Stats Graph Tab: 'Daily' | 'Weekly' | 'Monthly' */
  chartTab = signal<'Daily' | 'Weekly' | 'Monthly'>('Monthly');

  monthOffset = signal(0);
  /** Null = show all dates in the bottom table; YYYY-MM-DD = filter table to that clicked date */
  selectedDate = signal<string | null>(null);
  search = signal('');
  statusFilter = signal<'All' | BookingStatus>('All');
  feedback = signal<{ text: string; isError: boolean } | null>(null);

  // Full Customer Detail Modal state
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

  monthLabel = computed(() => {
    const base = new Date();
    const d = new Date(base.getFullYear(), base.getMonth() + this.monthOffset(), 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  /** Top 4 Horizontal Stat Cards + Right-Column Summary Metrics */
  summary = computed(() => {
    if (this.viewMode() === 'room') {
      const list = this.data.bookings();
      const totalRooms = this.data.rooms().length || 4;
      const newBookings = list.length;
      const confirmed = list.filter(b => b.status === 'Confirmed' || b.status === 'CheckedIn' || b.status === 'CheckedOut').length;
      const checkIns = list.filter(b => b.status === 'CheckedIn' || b.status === 'Confirmed').length;
      const checkOuts = list.filter(b => b.status === 'CheckedOut').length;

      // Rooms occupied today
      const todayYmd = this.selectedDate() ?? this.data.today;
      const occupiedToday = list.filter(
        b => b.checkIn <= todayYmd && todayYmd < b.checkOut && b.status !== 'Cancelled' && b.status !== 'Rejected'
      ).length;
      const availableToday = Math.max(0, totalRooms - occupiedToday);
      const availPct = Math.round((availableToday / totalRooms) * 100);
      const soldPct = Math.min(100, Math.round((occupiedToday / totalRooms) * 100));

      const totalGuests = list.reduce((s, b) => s + b.guests, 0);
      const revenue = list
        .filter(b => b.paymentStatus === 'Paid' || b.status === 'Confirmed' || b.status === 'CheckedIn' || b.status === 'CheckedOut')
        .reduce((s, b) => s + b.total, 0);

      return {
        newBookings,
        confirmed,
        checkIns,
        checkOuts,
        availLabel: 'Available Room Today',
        soldLabel: 'Sold Out Room Today',
        availableToday,
        occupiedToday,
        availPct,
        soldPct,
        totalGuests,
        totalCustomers: list.length,
        totalUnits: totalRooms,
        unitLabel: 'Total Room',
        revenue
      };
    } else {
      const list = this.data.tripBookings();
      const totalTrips = this.data.trips().length || 3;
      const newBookings = list.length;
      const confirmed = list.filter(t => t.status === 'Confirmed' || t.status === 'CheckedIn' || t.status === 'CheckedOut').length;
      const checkIns = list.filter(t => t.status === 'Confirmed' || t.status === 'CheckedIn').length;
      const checkOuts = list.filter(t => t.status === 'CheckedOut').length;

      const todayYmd = this.selectedDate() ?? this.data.today;
      const activeToday = list.filter(
        t => t.startDate <= todayYmd && todayYmd <= t.endDate && t.status !== 'Cancelled' && t.status !== 'Rejected'
      ).length;
      const availableToday = Math.max(0, totalTrips - activeToday);
      const availPct = Math.round((availableToday / totalTrips) * 100);
      const soldPct = Math.min(100, Math.round((activeToday / totalTrips) * 100));

      const totalGuests = list.reduce((s, t) => s + t.travellers, 0);
      const revenue = list
        .filter(t => t.paymentStatus === 'Paid' || t.status === 'Confirmed')
        .reduce((s, t) => s + t.total, 0);

      return {
        newBookings,
        confirmed,
        checkIns,
        checkOuts,
        availLabel: 'Available Trips Today',
        soldLabel: 'Booked Trips Today',
        availableToday,
        occupiedToday: activeToday,
        availPct,
        soldPct,
        totalGuests,
        totalCustomers: list.length,
        totalUnits: totalTrips,
        unitLabel: 'Total Trips',
        revenue
      };
    }
  });

  /** Reservation Stats Bar Chart (Sunday..Saturday paired Check-In & Check-Out bars) */
  chartBars = computed<ChartBarGroup[]>(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const baseIn  = [18, 56, 90, 80, 26, 16, 70];
    const baseOut = [60, 65, 16, 36, 30, 8, 40];
    const tab = this.chartTab();
    const mult = tab === 'Daily' ? 0.65 : tab === 'Weekly' ? 0.85 : 1;

    // Also count actual weekday check-ins / check-outs from live bookings
    const inCounts = [0, 0, 0, 0, 0, 0, 0];
    const outCounts = [0, 0, 0, 0, 0, 0, 0];

    if (this.viewMode() === 'room') {
      for (const b of this.data.bookings()) {
        const dIn = new Date(b.checkIn + 'T00:00:00');
        const dOut = new Date(b.checkOut + 'T00:00:00');
        if (!Number.isNaN(dIn.getTime())) inCounts[dIn.getDay()]++;
        if (!Number.isNaN(dOut.getTime())) outCounts[dOut.getDay()]++;
      }
    } else {
      for (const t of this.data.tripBookings()) {
        const dIn = new Date(t.startDate + 'T00:00:00');
        const dOut = new Date(t.endDate + 'T00:00:00');
        if (!Number.isNaN(dIn.getTime())) inCounts[dIn.getDay()]++;
        if (!Number.isNaN(dOut.getTime())) outCounts[dOut.getDay()]++;
      }
    }

    return days.map((label, idx) => {
      const checkInHeight = Math.min(100, Math.round(baseIn[idx] * mult + inCounts[idx] * 12));
      const checkOutHeight = Math.min(100, Math.round(baseOut[idx] * mult + outCounts[idx] * 12));
      return {
        label,
        checkInHeight,
        checkOutHeight,
        checkInCount: inCounts[idx],
        checkOutCount: outCounts[idx]
      };
    });
  });

  /** Top-Left Calendar Tiles (switches automatically between Room mode and Trip mode) */
  calendarDays = computed<CalendarDay[]>(() => {
    const cells = this.buildMonthDates(this.monthOffset());
    const mode = this.viewMode();

    if (mode === 'room') {
      const bookings = this.data.bookings();
      return cells.map(c => {
        const active = bookings.filter(b => b.checkIn <= c.ymd && c.ymd < b.checkOut);
        let state: CalendarDay['state'] = 'free';
        if (active.some(b => (b.status === 'Confirmed' || b.status === 'CheckedIn' || b.status === 'CheckedOut') && b.paymentStatus === 'Paid')) {
          state = 'booked';
        } else if (active.some(b => b.status === 'Confirmed' || b.status === 'CheckedIn')) {
          state = 'confirmed';
        } else if (active.some(b => b.status === 'Pending')) {
          state = 'pending';
        } else if (active.some(b => b.status === 'Cancelled' || b.status === 'Rejected')) {
          state = 'canceled';
        }
        return { ...c, state, count: active.length };
      });
    } else {
      const trips = this.data.tripBookings();
      return cells.map(c => {
        const active = trips.filter(t => t.startDate <= c.ymd && c.ymd <= t.endDate);
        let state: CalendarDay['state'] = 'free';
        if (active.some(t => t.status === 'Confirmed' && t.paymentStatus === 'Paid')) {
          state = 'booked';
        } else if (active.some(t => t.status === 'Confirmed')) {
          state = 'confirmed';
        } else if (active.some(t => t.status === 'Pending')) {
          state = 'pending';
        } else if (active.some(t => t.status === 'Cancelled' || t.status === 'Rejected')) {
          state = 'canceled';
        }
        return { ...c, state, count: active.length };
      });
    }
  });

  /** Filtered Room Bookings sorted by ID in DESCENDING order (exact match with Bookings page) */
  filteredRoomBookings = computed(() => {
    const d = this.selectedDate();
    const st = this.statusFilter();
    const q = this.search().trim().toLowerCase();

    return this.data
      .bookings()
      .filter(b => {
        if (d && !(b.checkIn <= d && d < b.checkOut)) return false;
        if (st !== 'All' && b.status !== st) return false;
        if (!q) return true;
        const rName = this.roomName(b.roomId).toLowerCase();
        return (
          b.guestName.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q) ||
          (b.email?.toLowerCase().includes(q) ?? false) ||
          b.id.toLowerCase().includes(q) ||
          rName.includes(q)
        );
      })
      .slice()
      .sort((a, b) => this.extractIdNum(b.id) - this.extractIdNum(a.id));
  });

  /** Filtered Trip Bookings sorted by ID in DESCENDING order (exact match with Bookings page) */
  filteredTripBookings = computed(() => {
    const d = this.selectedDate();
    const st = this.statusFilter();
    const q = this.search().trim().toLowerCase();

    return this.data
      .tripBookings()
      .filter(t => {
        if (d && !(t.startDate <= d && d <= t.endDate)) return false;
        if (st !== 'All' && t.status !== st) return false;
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

  switchMode(mode: 'room' | 'trip') {
    this.viewMode.set(mode);
    this.selectedDate.set(null);
    this.statusFilter.set('All');
    this.search.set('');
    this.feedback.set(null);
  }

  toggleDate(ymd: string) {
    this.selectedDate.update(cur => (cur === ymd ? null : ymd));
  }

  changeMonth(delta: number) {
    this.monthOffset.update(v => v + delta);
  }

  selectToday() {
    this.monthOffset.set(0);
    this.selectedDate.set(this.data.today);
  }

  formatDate(ymd: string): string {
    return formatStayDate(ymd);
  }

  statusLabel(st: string): string {
    if (st === 'CheckedIn') return 'Checked In';
    if (st === 'CheckedOut') return 'Checked Out';
    return st;
  }

  nights(checkIn: string, checkOut: string): number {
    return countNights(checkIn, checkOut);
  }

  roomName(roomId: number): string {
    return this.data.roomById(roomId)?.name ?? `Room #${roomId}`;
  }

  roomPrice(roomId: number): number {
    return this.data.roomById(roomId)?.price ?? 0;
  }

  openRoomCustomer(id: string) {
    this.activeTripBookingId.set(null);
    this.activeRoomBookingId.set(id);
  }

  openTripCustomer(id: string) {
    this.activeRoomBookingId.set(null);
    this.activeTripBookingId.set(id);
  }

  closeCustomerModal() {
    this.activeRoomBookingId.set(null);
    this.activeTripBookingId.set(null);
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

  markRoomPaid(id: string) {
    this.data.markBookingPaid(id, 'UPI / Online');
    this.feedback.set({ text: `Room booking ${id} marked as Paid ✓`, isError: false });
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

  private buildMonthDates(offset: number): { ymd: string; dayNum: string; isToday: boolean }[] {
    const base = new Date();
    const year = base.getFullYear();
    const month = base.getMonth() + offset;
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const list: { ymd: string; dayNum: string; isToday: boolean }[] = [];
    const targetYear = first.getFullYear();
    const targetMonth = first.getMonth() + 1;
    const mm = String(targetMonth).padStart(2, '0');

    for (let day = 1; day <= daysInMonth; day++) {
      const dd = String(day).padStart(2, '0');
      const ymd = `${targetYear}-${mm}-${dd}`;
      list.push({
        ymd,
        dayNum: dd,
        isToday: ymd === this.data.today
      });
    }
    return list;
  }
}