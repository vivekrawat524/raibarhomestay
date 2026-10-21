import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LangService } from '../../core/lang.service';
import { SITE, TEMPLES, TRIPS, templeCount } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-trip-detail', standalone: true, imports: [FormsModule, RouterLink, LangSwitchComponent], templateUrl: './trip-detail.component.html', styleUrl: './trip-detail.component.scss' })
export class TripDetailComponent {
  l = inject(LangService);
  site = SITE;
  temples = TEMPLES;
  trip = TRIPS.find(t => t.id === Number(inject(ActivatedRoute).snapshot.paramMap.get('id')));
  count = this.trip ? templeCount(this.trip) : 0;
  /** which optional temples are ticked: { de: true, bi: false } */
  picked: Record<string, boolean> = {};
  f = { date: '', travellers: 2, name: '', phone: '' };
  sent = false;

  constructor() { if (!this.trip) inject(Router).navigateByUrl('/'); }

  get chosen() { return this.trip?.options.filter(k => this.picked[k]) ?? []; }
  get total() { return (this.trip?.price ?? 0) * this.f.travellers; }

  submit() {
    if (!this.f.name || !this.f.phone || !this.f.date) return;
    const opts = this.chosen.map(k => TEMPLES[k].name).join(', ') || 'None';
    // TODO: send to your backend instead of / in addition to WhatsApp
    const msg = `Trip enquiry%0ATrip: ${this.trip!.title}%0AStart: ${this.f.date}%0ATravellers: ${this.f.travellers}%0AOptional temples: ${opts}%0AName: ${this.f.name}%0APhone: ${this.f.phone}`;
    window.open(`https://wa.me/${this.site.whatsapp}?text=${msg}`, '_blank');
    this.sent = true;
  }
}