import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../../core/lang.service';
import { ROOMS } from '../../core/site.data';
import { LangSwitchComponent } from '../../shared/lang-switch/lang-switch.component';

@Component({ selector: 'app-rooms', standalone: true, imports: [RouterLink, LangSwitchComponent], templateUrl: './rooms.component.html', styleUrl: './rooms.component.scss' })
export class RoomsComponent { l = inject(LangService); rooms = ROOMS; }