import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../../core/lang.service';
import { TRIPS, hasOption, templeCount } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-trips', standalone: true, imports: [RouterLink, LangSwitchComponent], templateUrl: './trips.component.html', styleUrl: './trips.component.scss' })
export class TripsComponent { l = inject(LangService); trips = TRIPS; count = templeCount; hasOption = hasOption; }