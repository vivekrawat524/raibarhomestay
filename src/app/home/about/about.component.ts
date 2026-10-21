import { Component, inject } from '@angular/core';
import { LangService } from '../../core/lang.service';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-about', standalone: true, imports: [LangSwitchComponent], templateUrl: './about.component.html', styleUrl: './about.component.scss' })
export class AboutComponent { l = inject(LangService); }