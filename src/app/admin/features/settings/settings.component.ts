import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../data/admin-data.service';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  data = inject(AdminDataService);
  feedback = signal('');

  form = { ...this.data.settings() };

  save() {
    this.data.saveSettings(this.form);
    this.feedback.set('Business settings saved.');
  }

  resetDemo() {
    this.data.resetDemoData();
    this.form = { ...this.data.settings() };
    this.feedback.set('All demo data reset to default 5 rooms, 3 trips and sample bookings.');
  }
}