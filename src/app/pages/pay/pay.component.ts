import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../admin/data/admin-data.service';
import { countNights, toWhatsAppPhone } from '../../admin/data/admin.models';
import { LangService } from '../../core/lang.service';
import { SITE } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({
  selector: 'app-pay',
  standalone: true,
  imports: [FormsModule, RouterLink, LangSwitchComponent],
  templateUrl: './pay.component.html',
  styleUrl: './pay.component.scss'
})
export class PayComponent {
  l = inject(LangService);
  data = inject(AdminDataService);
  site = SITE;

  bookingId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  method = 'UPI (GPay / PhonePe / Paytm)';
  upiRef = '';
  justPaid = signal(false);

  methods = [
    'UPI (GPay / PhonePe / Paytm)',
    'Debit / Credit Card',
    'NetBanking'
  ];

  get booking() {
    return this.data.bookingById(this.bookingId);
  }

  get room() {
    const b = this.booking;
    return b ? this.data.roomById(b.roomId) : undefined;
  }

  get nights(): number {
    const b = this.booking;
    return b ? countNights(b.checkIn, b.checkOut) : 0;
  }

  payNow() {
    const b = this.booking;
    if (!b) return;
    const label = this.upiRef.trim() ? `${this.method} (Ref: ${this.upiRef.trim()})` : this.method;
    this.data.markBookingPaid(b.id, label);
    this.justPaid.set(true);
  }

  get adminReceiptWaUrl(): string {
    const b = this.booking;
    if (!b) return this.site.waLink;
    const adminPhone = toWhatsAppPhone(this.data.settings().whatsapp || this.site.whatsapp);
    const text =
      `Hello *${this.data.settings().name}* 🙏\n` +
      `I have completed the payment of *₹${b.total}* for my booking!\n\n` +
      `*Booking ID:* ${b.id}\n` +
      `*Guest Name:* ${b.guestName}\n` +
      `*Room:* ${this.room?.name ?? ''}\n` +
      `*Dates:* ${b.checkIn} to ${b.checkOut}\n` +
      `*Payment Method:* ${b.paymentMethod ?? this.method}`;
    return `https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`;
  }
}