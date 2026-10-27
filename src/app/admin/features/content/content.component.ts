import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../data/admin-data.service';
import { ReviewStatus, formatStayDate } from '../../data/admin.models';

@Component({
  selector: 'app-content',
  imports: [FormsModule],
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss'
})
export class ContentComponent {
  data = inject(AdminDataService);
  feedback = signal('');
  reviewFilter = signal<'All' | ReviewStatus>('All');

  textForm = {
    heroTagline: this.data.content().heroTagline,
    aboutHeading: this.data.content().aboutHeading,
    aboutText: this.data.content().aboutText
  };

  newPhoto = { src: 'images/p1.png', alt: '' };

  /** Form for adding a custom RAG Knowledge Base document */
  kbForm = {
    title: '',
    category: 'Homestay FAQ',
    content: '',
    keywords: ''
  };

  geminiKeyInput = this.data.geminiApiKey();

  pendingReviewsCount = computed(
    () => this.data.reviews().filter(r => r.status === 'Pending').length
  );

  filteredReviews = computed(() => {
    const f = this.reviewFilter();
    return this.data
      .reviews()
      .filter(r => f === 'All' || r.status === f)
      .slice()
      .sort((a, b) => {
        const na = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const nb = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        return nb - na;
      });
  });

  formatDate(ymd: string): string {
    return formatStayDate(ymd);
  }

  saveText() {
    this.data.saveSiteText(
      this.textForm.heroTagline.trim(),
      this.textForm.aboutHeading.trim(),
      this.textForm.aboutText.trim()
    );
    this.feedback.set('Homepage text saved.');
  }

  addPhoto() {
    if (!this.newPhoto.src.trim()) return;
    this.data.addGalleryPhoto(this.newPhoto.src, this.newPhoto.alt);
    this.newPhoto = { src: 'images/p1.png', alt: '' };
    this.feedback.set('Photo added to gallery.');
  }

  removePhoto(id: string) {
    this.data.removeGalleryPhoto(id);
    this.feedback.set('Photo removed from gallery.');
  }

  setReview(id: string, status: ReviewStatus) {
    this.data.setReviewStatus(id, status);
    this.feedback.set(
      status === 'Approved'
        ? `Review ${id} accepted and is now live on the website!`
        : `Review ${id} hidden from the website.`
    );
  }

  deleteReview(id: string) {
    this.data.deleteReview(id);
    this.feedback.set(`Review ${id} permanently deleted.`);
  }

  addKnowledgeDoc() {
    if (!this.kbForm.title.trim() || !this.kbForm.content.trim()) return;
    this.data.addRagDoc(
      this.kbForm.title,
      this.kbForm.category,
      this.kbForm.content,
      this.kbForm.keywords
    );
    this.kbForm = { title: '', category: 'Homestay FAQ', content: '', keywords: '' };
    this.feedback.set('New knowledge document indexed into the RAG AI Assistant!');
  }

  deleteKnowledgeDoc(id: string) {
    this.data.deleteRagDoc(id);
    this.feedback.set(`Knowledge document ${id} removed from RAG index.`);
  }

  saveGeminiKey() {
    this.data.saveGeminiApiKey(this.geminiKeyInput);
    this.feedback.set(
      this.geminiKeyInput.trim()
        ? 'Gemini API Key saved for RAG AI generation!'
        : 'Cleared Gemini key (using built-in offline RAG synthesizer).'
    );
  }
}