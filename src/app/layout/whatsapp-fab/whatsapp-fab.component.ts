import { Component } from '@angular/core';
import { SITE } from '../../core/site.data';

@Component({ selector: 'app-whatsapp-fab', standalone: true, templateUrl: './whatsapp-fab.component.html', styleUrl: './whatsapp-fab.component.scss' })
export class WhatsappFabComponent { site = SITE; }