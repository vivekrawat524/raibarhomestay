import { Component, inject } from '@angular/core';
import { LangService } from '../../core/lang.service';
import { GALLERY } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-gallery', standalone: true, imports: [LangSwitchComponent], templateUrl: './gallery.component.html', styleUrl: './gallery.component.scss' })
export class GalleryComponent {
  l = inject(LangService);
  items = GALLERY;
  open: string | null = null;
}