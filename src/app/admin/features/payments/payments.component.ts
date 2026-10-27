import { Component, computed, inject } from '@angular/core';
import { AdminDataService } from '../../data/admin-data.service';

@Component({
  selector: 'app-payments',
  imports: [],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent {
  data = inject(AdminDataService);

  paidRevenue = computed(() =>
    this.data.bookings()
      .filter(b => b.paymentStatus === 'Paid')
      .reduce((sum, b) => sum + b.total, 0)
  );

  confirmedRevenue = computed(() =>
    this.data.bookings()
      .filter(b => b.status === 'Confirmed' || b.status === 'CheckedIn' || b.status === 'CheckedOut')
      .reduce((sum, b) => sum + b.total, 0)
  );

  pendingValue = computed(() =>
    this.data.bookings()
      .filter(b => b.status === 'Pending')
      .reduce((sum, b) => sum + b.total, 0)
  );
}