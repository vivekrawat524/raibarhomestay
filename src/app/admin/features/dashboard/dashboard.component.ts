import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

/** A summary box on the dashboard */
interface StatCard { label: string; value: string; note: string }

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  today = new Date();

  // Placeholder boxes. Real numbers come from the mock data in Task 3.
  cards: StatCard[] = [
    { label: 'New booking requests', value: '–', note: 'Waiting for your reply' },
    { label: 'Arrivals today',       value: '–', note: 'Guests checking in' },
    { label: 'Departures today',     value: '–', note: 'Guests checking out' },
    { label: 'Rooms free tonight',   value: '–', note: 'Out of 5 rooms' }
  ];
}