import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../../core/lang.service';
import { SITE } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-contact', standalone: true, imports: [RouterLink, LangSwitchComponent], templateUrl: './contact.component.html', styleUrl: './contact.component.scss' })
export class ContactComponent { l = inject(LangService); site = SITE; }