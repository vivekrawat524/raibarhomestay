import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../data/admin-data.service';
import { AdminRoom } from '../../data/admin.models';
import { dayOffset } from '../../data/admin.seed';

@Component({
  selector: 'app-rooms',
  imports: [FormsModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.scss'
})
export class RoomsComponent {
  data = inject(AdminDataService);

  showEditor = signal(false);
  editingId = signal<number | undefined>(undefined);
  feedback = signal<{ text: string; isError: boolean } | null>(null);

  /** Form model for adding or editing a room */
  form = {
    name: '',
    desc: '',
    price: 1000,
    capacity: 2,
    img: 'images/p5.jpeg',
    tagsText: '2 GUESTS, WIFI, HOT WATER',
    active: true
  };

  /** Per-room blocked-date inputs keyed by roomId */
  blockInputs: Record<number, { from: string; to: string; reason: string }> = {};

  blockFormFor(roomId: number) {
    if (!this.blockInputs[roomId]) {
      this.blockInputs[roomId] = { from: dayOffset(5), to: dayOffset(7), reason: 'Maintenance' };
    }
    return this.blockInputs[roomId];
  }

  openNewRoom() {
    this.editingId.set(undefined);
    this.form = {
      name: '',
      desc: '',
      price: 1200,
      capacity: 2,
      img: 'images/p5.jpeg',
      tagsText: '2 GUESTS, MOUNTAIN VIEW, WIFI, HOT WATER',
      active: true
    };
    this.showEditor.set(true);
  }

  openEditRoom(room: AdminRoom) {
    this.editingId.set(room.id);
    this.form = {
      name: room.name,
      desc: room.desc,
      price: room.price,
      capacity: room.capacity,
      img: room.img,
      tagsText: room.tags.join(', '),
      active: room.active
    };
    this.showEditor.set(true);
  }

  saveRoom() {
    if (!this.form.name.trim() || this.form.price <= 0) {
      this.feedback.set({ text: 'Please enter a valid room name and nightly price.', isError: true });
      return;
    }

    const tags = this.form.tagsText
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(Boolean);

    const saved = this.data.saveRoom({
      id: this.editingId(),
      name: this.form.name.trim(),
      desc: this.form.desc.trim(),
      price: Number(this.form.price),
      capacity: Number(this.form.capacity) || 2,
      img: this.form.img.trim() || 'images/p5.jpeg',
      tags,
      active: this.form.active
    });

    this.feedback.set({
      text: `${saved.name} saved (₹${saved.price}/night).`,
      isError: false
    });
    this.showEditor.set(false);
  }

  toggleActive(room: AdminRoom) {
    this.data.toggleRoomActive(room.id);
    this.feedback.set({
      text: `${room.name} is now ${room.active ? 'hidden (inactive)' : 'active'}.`,
      isError: false
    });
  }

  addBlock(roomId: number) {
    const input = this.blockFormFor(roomId);
    const res = this.data.addBlockedRange(roomId, input.from, input.to, input.reason);
    this.feedback.set({
      text: res.ok ? 'Blocked dates added.' : (res.error ?? 'Could not block dates.'),
      isError: !res.ok
    });
  }

  removeBlock(roomId: number, blockId: string) {
    this.data.removeBlockedRange(roomId, blockId);
    this.feedback.set({ text: 'Blocked date range removed.', isError: false });
  }
}