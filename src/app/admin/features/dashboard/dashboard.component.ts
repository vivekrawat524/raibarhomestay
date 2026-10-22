import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminDataService } from '../../data/admin-data.service';
import { dayOffset } from '../../data/admin.seed';

/** A summary box on the dashboard */
interface StatCard { label: string; value: string; note: string }

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  data = inject(AdminDataService);
  today = new Date();
  feedback = signal('');

  cards = computed<StatCard[]>(() => {
    const activeRooms = this.data.rooms().filter(r => r.active).length;
    return [
      {
        label: 'New booking requests',
        value: String(this.data.pendingBookings().length),
        note: 'Waiting for your reply'
      },
      {
        label: 'Arrivals today',
        value: String(this.data.arrivalsToday().length),
        note: 'Guests checking in'
      },
      {
        label: 'Departures today',
        value: String(this.data.departuresToday().length),
        note: 'Guests checking out'
      },
      {
        label: 'Rooms free tonight',
        value: `${this.data.freeRoomsTonight().length} / ${activeRooms}`,
        note: `Out of ${activeRooms} active rooms`
      }
    ];
  });

  /** Each room with its status tonight (Free or Occupied) */
  tonightRooms = computed(() => {
    const todayStr = this.data.today;
    const tomorrowStr = dayOffset(1);
    return this.data.rooms().map(room => ({
      ...room,
      occupied: this.data.hasRoomConflict(room.id, todayStr, tomorrowStr)
    }));
  });

  roomName(roomId: number): string {
    return this.data.roomById(roomId)?.name ?? `Room #${roomId}`;
  }

  confirm(id: string) {
    const res = this.data.updateBookingStatus(id, 'Confirmed');
    this.feedback.set(res.ok ? `Booking ${id} confirmed.` : res.error ?? '');
  }

  reject(id: string) {
    const res = this.data.updateBookingStatus(id, 'Rejected');
    this.feedback.set(res.ok ? `Booking ${id} rejected.` : res.error ?? '');
  }
}