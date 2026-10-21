import { Injectable, signal } from '@angular/core';

export type Lang = 'en' | 'hi';

@Injectable({ providedIn: 'root' })
export class LangService {
  lang = signal<Lang>('en');
  set(l: Lang) { this.lang.set(l); document.documentElement.lang = l; }
  /** Use in templates: {{ l.t('Rooms', 'कमरे') }} */
  t(en: string, hi?: string) { return this.lang() === 'hi' && hi ? hi : en; }
}