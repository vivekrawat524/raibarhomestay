import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SITE } from '../../core/site.data';
import { AdminDataService } from '../../admin/data/admin-data.service';
import { AssistantAnswer } from '../../admin/data/admin.models';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  sources?: { title: string; docName: string; score: number }[];
  actionLink?: string;
  actionLabel?: string;
  latencyMs?: number;
}

@Component({
  selector: 'app-whatsapp-fab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './whatsapp-fab.component.html',
  styleUrl: './whatsapp-fab.component.scss'
})
export class WhatsappFabComponent {
  site = SITE;
  adminData = inject(AdminDataService);
  router = inject(Router);

  isOpen = signal<boolean>(false);
  isThinking = signal<boolean>(false);
  userQuery = signal<string>('');
  showKeyModal = signal<boolean>(false);
  apiKeyInput = this.adminData.geminiApiKey();

  saveApiKey() {
    this.adminData.saveGeminiApiKey(this.apiKeyInput.trim());
    this.showKeyModal.set(false);
  }

  messages = signal<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Namaste! 🙏 I am your Raibar Homestay AI Assistant. Ask me anything about our mountain rooms, homemade Pahadi meals, check-in policies, or Garhwal temple trekking guides!',
      time: 'Just now'
    }
  ]);

  quickQuestions = [
    'How much for 4 guests for 2 nights?',
    'What should I pack for the Deeba Mandir trek?',
    'What is the check-in time and meal policy?'
  ];

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  closeChat() {
    this.isOpen.set(false);
  }

  async sendQuery(text?: string) {
    const q = (text || this.userQuery()).trim();
    if (!q || this.isThinking()) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add user message
    this.messages.update(list => [
      ...list,
      { sender: 'user', text: q, time: now }
    ]);
    this.userQuery.set('');
    this.isThinking.set(true);

    try {
      // 2. Ask RAG AI Assistant with conversation history
      const history = this.messages().map(m => ({ sender: m.sender, text: m.text }));
      const res: AssistantAnswer = await this.adminData.askAssistant(q, history);

      this.messages.update(list => [
        ...list,
        {
          sender: 'assistant',
          text: res.answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: res.sources,
          actionLink: res.actionLink,
          actionLabel: res.actionLabel,
          latencyMs: res.latencyMs
        }
      ]);
    } catch {
      this.messages.update(list => [
        ...list,
        {
          sender: 'assistant',
          text: 'Namaste! Please connect with us directly on WhatsApp for immediate room booking assistance.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionLink: '/book',
          actionLabel: 'Book Your Stay →'
        }
      ]);
    } finally {
      this.isThinking.set(false);
    }
  }

  navigate(link: string) {
    this.closeChat();
    this.router.navigateByUrl(link);
  }
}
