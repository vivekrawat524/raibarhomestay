import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminDataService } from '../../admin/data/admin-data.service';
import { LangService } from '../../core/lang.service';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-rooms', standalone: true, imports: [RouterLink, LangSwitchComponent], templateUrl: './rooms.component.html', styleUrl: './rooms.component.scss' })
export class RoomsComponent {
  l = inject(LangService);
  private adminData = inject(AdminDataService);

  /** Shows all active rooms from the Admin Panel */
  get rooms() { return this.adminData.rooms().filter(r => r.active); }
}