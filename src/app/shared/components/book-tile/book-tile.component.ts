import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { FocusableDirective } from '../../directives/focusable.directive';
import { LibraryItem, MediaProgress } from '../../../core/models/abs.models';
import { AudiobookshelfService } from '../../../core/services/audiobookshelf.service';

@Component({
  selector: 'app-book-tile',
  standalone: true,
  imports: [CommonModule, RouterLink, ProgressBarModule, FocusableDirective],
  template: `
    <div
      class="book-tile"
      appFocusable
      [class.finished]="isFinished"
      (click)="onSelect()"
      (keydown.enter)="onSelect()"
    >
      <div class="cover-wrap">
        <img
          [src]="coverUrl"
          [alt]="title"
          class="cover-img"
          (error)="onImgError($event)"
          loading="lazy"
        />

        @if (isFinished) {
          <div class="finished-overlay">
            <div class="check-badge">
              <i class="pi pi-check"></i>
            </div>
          </div>
        }

        @if (!isFinished && progress > 0) {
          <div class="progress-bar-wrap">
            <p-progressBar [value]="progress" [showValue]="false" />
          </div>
        }
      </div>

      <div class="book-meta">
        <span class="book-title truncate">{{ title }}</span>
        <span class="book-author truncate text-muted">{{ author }}</span>
      </div>
    </div>
  `,
  styles: [`
    .book-tile {
      display: flex;
      flex-direction: column;
      width: 148px;
      flex-shrink: 0;
      cursor: pointer;
      border-radius: var(--radius);
      transition: transform 0.2s;

      &:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 4px;
      }

      &:hover .cover-img, &:focus-visible .cover-img {
        transform: scale(1.03);
        box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
      }

      &.finished .cover-img {
        filter: brightness(0.5) saturate(0.6);
      }
    }

    .cover-wrap {
      position: relative;
      width: 148px;
      height: 222px;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--bg-card);
    }

    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .finished-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .check-badge {
      width: 44px;
      height: 44px;
      background: var(--success);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(34, 197, 94, 0.4);

      i {
        color: white;
        font-size: 20px;
        font-weight: 700;
      }
    }

    .progress-bar-wrap {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 0 4px 4px;
    }

    .book-meta {
      padding: 8px 4px 4px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .book-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      display: block;
    }

    .book-author {
      font-size: 11px;
      display: block;
    }
  `]
})
export class BookTileComponent implements OnInit {
  @Input({ required: true }) item!: LibraryItem;
  @Input() mediaProgress?: MediaProgress;

  coverUrl = '';
  title = '';
  author = '';
  progress = 0;
  isFinished = false;

  constructor(private absService: AudiobookshelfService) {}

  ngOnInit(): void {
    this.coverUrl = this.absService.coverUrl(this.item.id);
    this.title = this.item.media.metadata.title;
    this.author = this.item.media.metadata.authors.map(a => a.name).join(', ');

    const prog = this.mediaProgress ?? this.item.userMediaProgress;
    if (prog) {
      this.isFinished = prog.isFinished;
      this.progress = Math.round(prog.progress * 100);
    }
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/cover-placeholder.svg';
  }

  onSelect(): void {
    // Navigation handled by parent or router
  }
}
