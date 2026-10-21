import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../../core/lang.service';
import { HERO_SLIDES, HERO_WORDS, SITE } from '../../core/site.data';

@Component({ selector: 'app-hero', standalone: true, imports: [RouterLink], templateUrl: './hero.component.html', styleUrl: './hero.component.scss' })
export class HeroComponent implements OnInit, OnDestroy {
  l = inject(LangService);
  site = SITE;
  slides = HERO_SLIDES;
  words = HERO_WORDS;
  active = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit() { this.timer = setInterval(() => this.active.update(i => (i + 1) % this.slides.length), 5000); }
  ngOnDestroy() { clearInterval(this.timer); }
}