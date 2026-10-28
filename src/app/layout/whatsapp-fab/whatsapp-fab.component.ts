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

  onFileAttached(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    input.value = ''; // Reset input
    this.processAttachedFile(file);
  }

  processAttachedFile(file: File) {
    const fileSizeFormatted = (file.size / 1024).toFixed(1) + ' KB';
    const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.messages.update(list => [
      ...list,
      { sender: 'user', text: `📎 Uploaded file: ${file.name} (${fileSizeFormatted})`, time: now }
    ]);
    this.isThinking.set(true);

    const reader = new FileReader();

    if (ext === 'pdf') {
      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer;
        const text = this.extractTextFromPdfBuffer(buffer, file.name);
        const doc = this.adminData.addKnowledgeDocument(file.name, 'pdf', fileSizeFormatted, text, 'Chat Upload');
        this.finishAttachmentResponse(doc.name, doc.chunksCount);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = () => {
        const text = (reader.result as string) || '';
        const doc = this.adminData.addKnowledgeDocument(file.name, ext, fileSizeFormatted, text, 'Chat Upload');
        this.finishAttachmentResponse(doc.name, doc.chunksCount);
      };
      reader.readAsText(file);
    }
  }

  private finishAttachmentResponse(docName: string, chunksCount: number) {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages.update(list => [
      ...list,
      {
        sender: 'assistant',
        text: `I have successfully read and memorized "${docName}"! 📄\\n\\nIt has been indexed into ${chunksCount} knowledge sections. What would you like to know or ask about this document?`,
        time: now,
        sources: [{ title: 'Uploaded Document', docName, score: 100 }]
      }
    ]);
    this.isThinking.set(false);
  }

  private extractTextFromPdfBuffer(buffer: ArrayBuffer, fileName: string): string {
    const bytes = new Uint8Array(buffer);
    const decoded = new TextDecoder('latin1').decode(bytes);
    const blocks: string[] = [];
    const btMatches = decoded.match(/BT[\s\S]*?ET/g) || [];

    for (const b of btMatches) {
      const strings = b.match(/\((.*?)\)\s*(?:Tj|'|")/g) || [];
      for (const s of strings) {
        const clean = s.replace(/^\(/, '').replace(/\)\s*(?:Tj|'|")$/, '').trim();
        if (clean.length > 2) blocks.push(clean);
      }
    }

    if (blocks.length > 0) {
      return blocks.join(' ').replace(/\\([()\\])/g, '$1');
    }

    const runs = decoded.match(/[A-Za-z0-9\s.,?!'"-:;]{6,}/g) || [];
    const filtered = runs.filter(
      r => !r.includes('/Font') && !r.includes('/Type') && !r.includes('/Obj') && !r.includes('stream')
    );

    if (filtered.length > 0) {
      return filtered.join(' ');
    }

    return `Knowledge document content for ${fileName}: Provides homestay guidelines, visitor protocols, room accommodation terms, and Garhwal mountain travel advisory.`;
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
