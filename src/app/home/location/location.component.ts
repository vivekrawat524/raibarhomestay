import { Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LangService } from '../../core/lang.service';
import { SITE } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-location', standalone: true, imports: [LangSwitchComponent], templateUrl: './location.component.html', styleUrl: './location.component.scss' })
export class LocationComponent {
  l = inject(LangService);
  site = SITE;
  /** Angular blocks iframe URLs unless we mark them as trusted */
  map = inject(DomSanitizer).bypassSecurityTrustResourceUrl(SITE.mapEmbed);
}