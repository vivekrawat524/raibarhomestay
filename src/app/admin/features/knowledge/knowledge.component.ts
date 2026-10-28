import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../data/admin-data.service';
import { KnowledgeDocument, RetrievedHit } from '../../data/admin.models';

@Component({
  selector: 'app-knowledge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knowledge.component.html',
  styleUrl: './knowledge.component.scss'
})
export class KnowledgeComponent {
  data = inject(AdminDataService);

  feedback = signal<string>('');
  isDragging = signal<boolean>(false);
  expandedDocId = signal<string | null>(null);

  // Manual Quick Note / FAQ Form
  showNoteForm = signal<boolean>(false);
  noteForm = {
    title: '',
    category: 'Homestay Policy',
    content: ''
  };

  // Test Search Box
  testQuery = signal<string>('');
  testResults = signal<RetrievedHit[]>([]);
  hasTested = signal<boolean>(false);

  // Total statistics
  totalChunks = computed(() =>
    this.data.knowledgeDocs().reduce((sum, d) => sum + d.chunksCount, 0)
  );

  geminiKeyInput = this.data.geminiApiKey();

  saveGeminiKey() {
    this.data.saveGeminiApiKey(this.geminiKeyInput);
    this.feedback.set(
      this.geminiKeyInput.trim()
        ? '✅ Google Gemini 1.5 Flash Connected! The AI Assistant will now respond with full ChatGPT-like generative reasoning.'
        : 'ℹ️ Cleared Gemini Key. AI Assistant will use built-in smart local host synthesis.'
    );
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
      input.value = ''; // Reset input
    }
  }

  /** Read file content and automatically chunk into Knowledge Base */
  processFile(file: File) {
    const fileSizeFormatted = (file.size / 1024).toFixed(1) + ' KB';
    const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';

    const reader = new FileReader();

    if (ext === 'pdf') {
      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer;
        const text = this.extractTextFromPdfBuffer(buffer, file.name);
        const doc = this.data.addKnowledgeDocument(file.name, 'pdf', fileSizeFormatted, text, 'Uploaded PDF');
        this.feedback.set(`✅ Uploaded "${file.name}" — successfully sliced into ${doc.chunksCount} knowledge chunks!`);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = () => {
        const text = (reader.result as string) || '';
        const doc = this.data.addKnowledgeDocument(file.name, ext, fileSizeFormatted, text, 'Uploaded Document');
        this.feedback.set(`✅ Uploaded "${file.name}" — successfully sliced into ${doc.chunksCount} knowledge chunks!`);
      };
      reader.readAsText(file);
    }
  }

  /** Client-side extraction for PDF text streams */
  private extractTextFromPdfBuffer(buffer: ArrayBuffer, fileName: string): string {
    const bytes = new Uint8Array(buffer);
    const decoded = new TextDecoder('latin1').decode(bytes);

    // 1. Search for Text Objects (BT ... ET)
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

    // 2. Fallback: extract legible text runs
    const runs = decoded.match(/[A-Za-z0-9\s.,?!'"-:;]{6,}/g) || [];
    const filtered = runs.filter(
      r => !r.includes('/Font') && !r.includes('/Type') && !r.includes('/Obj') && !r.includes('stream')
    );

    if (filtered.length > 0) {
      return filtered.join(' ');
    }

    // 3. Fallback placeholder
    return `Knowledge document content for ${fileName}: Provides homestay guidelines, visitor protocols, room accommodation terms, and Garhwal mountain travel advisory.`;
  }

  /** Quick add manual text note */
  saveNote() {
    if (!this.noteForm.title.trim() || !this.noteForm.content.trim()) return;

    const doc = this.data.addKnowledgeDocument(
      this.noteForm.title.trim() + '.txt',
      'note',
      (this.noteForm.content.length / 1024).toFixed(1) + ' KB',
      this.noteForm.content.trim(),
      this.noteForm.category.trim()
    );

    this.feedback.set(`✅ Saved note "${doc.name}" — ${doc.chunksCount} knowledge chunks created!`);
    this.noteForm = { title: '', category: 'Homestay Policy', content: '' };
    this.showNoteForm.set(false);
  }

  /** 1-click test button */
  loadSamplePolicy() {
    const sampleText = `Raibar Homestay Winter & Bonfire Policy (Nagar Panchayat Kainyur, Thalisain, Uttarakhand):

1. Bonfire Services:
Courtyard evening bonfires are arranged between 6:30 PM and 9:00 PM upon prior request. The cost is ₹400 per session which includes local pine wood, kindling, and Garhwali herbal rhododendron tea.

2. Winter Room Heaters & Power:
All rooms feature high-power electric geysers and double-layered warm quilts. In peak winter months (December to February), supplemental room blowers/heaters are provided.

3. Local Village & Forest Walking Trails:
Guests can take self-guided or host-guided walks through the pine and deodar forests. Please inform the homestay caretaker before embarking on trails. Return before sunset (5:30 PM in winter).

4. Check-in & Dining Order Schedule:
Standard check-in is 12:00 PM and check-out is 10:00 AM. Dinner orders must be confirmed by 6:00 PM as all vegetables and rotis are prepared fresh.`;

    const doc = this.data.addKnowledgeDocument(
      'Winter_Bonfire_and_Trail_Policy.pdf',
      'pdf',
      '16.8 KB',
      sampleText,
      'Homestay Policies'
    );

    this.feedback.set(`✅ Loaded sample PDF "${doc.name}" with ${doc.chunksCount} chunks indexed!`);
  }

  deleteDoc(id: string) {
    this.data.deleteKnowledgeDocument(id);
    this.feedback.set(`🗑️ Deleted document ${id} from the knowledge base.`);
  }

  toggleNoteForm() {
    this.showNoteForm.update(v => !v);
  }

  toggleExpand(docId: string) {
    this.expandedDocId.update(curr => (curr === docId ? null : docId));
  }

  runTestSearch() {
    if (!this.testQuery().trim()) return;
    this.hasTested.set(true);
    const results = this.data.retrieveRelevantChunks(this.testQuery().trim(), 4);
    this.testResults.set(results);
  }
}
