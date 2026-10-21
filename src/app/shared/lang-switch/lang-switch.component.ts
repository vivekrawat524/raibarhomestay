import { Component, inject } from '@angular/core';
import { LangService } from '../../core/lang.service';

@Component({ selector: 'app-lang-switch', standalone: true, templateUrl: './lang-switch.component.html', styleUrl: './lang-switch.component.scss' })
export class LangSwitchComponent { l = inject(LangService); }