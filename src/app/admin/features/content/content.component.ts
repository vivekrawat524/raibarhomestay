import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../data/admin-data.service';
import { ReviewStatus } from '../../data/admin.models';

@Component({
  selector: 'app-content',
  imports: [FormsModule],
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss'
})
export class ContentComponent {
  data = inject(AdminDataService);
  feedback = signal('');

  textForm = {
    heroTagline: this.data.content().heroTagline,
    aboutHeading: this.data.content().aboutHeading,
    aboutText: this.data.content().aboutText
  };

  newPhoto = { src: 'images/p1.png', alt: '' };

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
    this.feedback.set(`Review ${id} marked as ${status}.`);
  }
}