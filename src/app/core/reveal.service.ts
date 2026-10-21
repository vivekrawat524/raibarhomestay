import { Injectable } from '@angular/core';

type Kind = 'up' | 'left' | 'right' | 'zoom';

/** sel = which elements, kind = how they enter, step = extra delay (ms) for each next sibling */
interface Rule { sel: string; kind: Kind; step?: number }

const RULES: Rule[] = [
  // small blocks directly inside a section: label, heading, text, buttons
  { sel: '.box:not(.hero) .wrap > :is(.sh, h2, p, .note, .cta, .actions)', kind: 'up', step: 90 },
  // two-column sections: left column slides from the left, right column from the right
  { sel: '.about > :first-child, .loc > :first-child', kind: 'left' },
  { sel: '.about > :last-child, .loc > :last-child', kind: 'right' },
  // card grids: each card rises one after another
  { sel: '.rooms > *, .tg > *, .list > *, .fg > *, .steps > *', kind: 'up', step: 130 },
  { sel: '.gal > *', kind: 'zoom', step: 90 },
  // reviews
  { sel: '.sum', kind: 'up' },
  { sel: '.rv > .form', kind: 'right' },
  // inner pages (booking, trip detail)
  { sel: '.bh > *', kind: 'up', step: 90 },
  { sel: '.bg > :first-child', kind: 'up' },
  { sel: '.bg > :last-child', kind: 'right' },
  // footer bottom bar
  { sel: '.fb', kind: 'up' }
];

const FROM: Record<Kind, string> = {
  up: 'translateY(42px)', left: 'translateX(-60px)', right: 'translateX(60px)', zoom: 'scale(.9)'
};

@Injectable({ providedIn: 'root' })
export class RevealService {
  private seen = new WeakSet<Element>();
  private io?: IntersectionObserver;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Call after a page has rendered. Safe to call many times: each element is set up once. */
  scan() {
    if (this.reduced || !('IntersectionObserver' in window)) return;   // people who turn animations off see everything at once

    this.io ??= new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) { this.io!.unobserve(e.target); this.play(e.target as HTMLElement); }
      }
    }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });      // start a little before it is fully on screen

    for (const rule of RULES) {
      const count = new Map<Element | null, number>();
      document.querySelectorAll<HTMLElement>(rule.sel).forEach(el => {
        if (this.seen.has(el)) return;
        this.seen.add(el);
        const n = count.get(el.parentElement) ?? 0;              // position among siblings, used for the stagger
        count.set(el.parentElement, n + 1);
        el.dataset['rv'] = rule.kind;
        el.dataset['rvDelay'] = String(n * (rule.step ?? 0));
        el.style.opacity = '0';                                  // hidden until it scrolls into view
        this.io!.observe(el);
      });
    }

    // numbers that count up (10+, 4.9, 320+)
    document.querySelectorAll<HTMLElement>('.stats b').forEach(el => {
      if (this.seen.has(el)) return;
      this.seen.add(el);
      const m = /^([\d.]+)(.*)$/.exec((el.textContent ?? '').trim());
      if (!m) return;
      el.dataset['rv'] = 'count'; el.dataset['to'] = m[1]; el.dataset['suffix'] = m[2];
      el.textContent = (0).toFixed(m[1].includes('.') ? 1 : 0) + m[2];
      this.io!.observe(el);
    });
  }

  private play(el: HTMLElement) {
    const kind = el.dataset['rv'] as Kind | 'count';
    if (kind === 'count') { this.countUp(el); return; }

    const a = el.animate(
      [{ opacity: 0, transform: FROM[kind] }, { opacity: 1, transform: 'none' }],
      { duration: 850, delay: +(el.dataset['rvDelay'] ?? 0), easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' }
    );
    // when finished, hand control back to the normal CSS (so hover effects keep working)
    a.onfinish = () => { el.style.opacity = ''; a.cancel(); };
  }

  private countUp(el: HTMLElement) {
    const to = +el.dataset['to']!;
    const dec = el.dataset['to']!.includes('.') ? 1 : 0;
    const suffix = el.dataset['suffix'] ?? '';
    const t0 = performance.now(), dur = 1600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec) + suffix;   // eased: fast then slow
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}