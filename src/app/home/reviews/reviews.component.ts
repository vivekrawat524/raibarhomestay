import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LangService } from '../../core/lang.service';
import { ReviewService } from '../../core/review.service';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-reviews', standalone: true, imports: [FormsModule, LangSwitchComponent], templateUrl: './reviews.component.html', styleUrl: './reviews.component.scss' })
export class ReviewsComponent {
  l = inject(LangService);
  svc = inject(ReviewService);
  stars = [1, 2, 3, 4, 5];
  rating = signal(0);
  hover = signal(0);
  f = { name: '', stay: 'Homestay stay', text: '' };
  error = signal('');
  done = signal(false);

  avgStars = computed(() => Math.round(this.svc.average()));
  bars = computed(() => [5, 4, 3, 2, 1].map(n => {
    const c = this.svc.reviews().filter(r => r.rating === n).length;
    const t = this.svc.count();
    return { n, c, pct: t ? (c / t) * 100 : 0 };
  }));

  ratingText(n: number) {
    return [
      '',
      this.l.t('Poor', 'खराब'), this.l.t('Fair', 'ठीक-ठाक'), this.l.t('Good', 'अच्छा'),
      this.l.t('Very good', 'बहुत अच्छा'), this.l.t('Excellent', 'उत्कृष्ट')
    ][n];
  }
  fmt(iso: string) { return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }); }
  initial(name: string) { return name.trim().charAt(0).toUpperCase() || '?'; }

  submit() {
    this.done.set(false);
    if (!this.rating()) { this.error.set(this.l.t('Please tap the stars to rate your stay.', 'कृपया स्टार दबाकर रेटिंग दें।')); return; }
    if (!this.f.name.trim()) { this.error.set(this.l.t('Please enter your name.', 'कृपया अपना नाम लिखें।')); return; }
    if (this.f.text.trim().length < 10) { this.error.set(this.l.t('Please write at least a short sentence (10 letters).', 'कृपया कम से कम एक छोटा वाक्य लिखें।')); return; }
    this.error.set('');
    this.svc.add({ name: this.f.name.trim().slice(0, 60), rating: this.rating(), text: this.f.text.trim().slice(0, 600), stay: this.f.stay });
    this.rating.set(0); this.f = { name: '', stay: 'Homestay stay', text: '' };
    this.done.set(true);
  }
}