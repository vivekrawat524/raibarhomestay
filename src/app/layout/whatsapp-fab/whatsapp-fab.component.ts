import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminDataService } from '../../admin/data/admin-data.service';
import { SITE } from '../../core/site.data';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  sources?: string[];
  actionLink?: string;
  actionLabel?: string;
}

@Component({
  selector: 'app-whatsapp-fab',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './whatsapp-fab.component.html',
  styleUrl: './whatsapp-fab.component.scss'
})
export class WhatsappFabComponent {
  site = SITE;
  private adminData = inject(AdminDataService);

  isOpen = signal(false);
  isThinking = signal(false);
  query = '';

  quickPrompts = [
    'Room price for 4 guests for 2 nights?',
    'Which rooms are available tonight?',
    'Tell me about the 5-Day Temple Trip',
    'Is food included in the room price?'
  ];

  messages = signal<ChatMessage[]>([
    {
      role: 'ai',
      text: 'Namaste! 🙏 I am the Raibar Homestay RAG AI Assistant. Ask me about live room availability, prices for your group, Garhwal temple trips, or homestay rules!',
      sources: ['Live Rooms & Calendar', 'Temple Trips & KB']
    }
  ]);

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  async sendPrompt(text?: string) {
    const q = (text ?? this.query).trim();
    if (!q || this.isThinking()) return;

    this.query = '';
    this.messages.update(list => [...list, { role: 'user', text: q }]);
    this.isThinking.set(true);

    const res = await this.adminData.askRag(q);
    this.messages.update(list => [
      ...list,
      {
        role: 'ai',
        text: res.answer,
        sources: res.sources,
        actionLink: res.actionLink,
        actionLabel: res.actionLabel
      }
    ]);
    this.isThinking.set(false);
  }
}