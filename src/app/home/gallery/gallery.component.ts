import { Component, inject } from '@angular/core';
import { AdminDataService } from '../../admin/data/admin-data.service';
import { LangService } from '../../core/lang.service';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-gallery', standalone: true, imports: [LangSwitchComponent], templateUrl: './gallery.component.html', styleUrl: './gallery.component.scss' })
export class GalleryComponent {
  l = inject(LangService);
  private adminData = inject(AdminDataService);
  get items() { return this.adminData.content().gallery; }
  open: string | null = null;
}