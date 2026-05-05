import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
      (focus)="focused.emit(item)"
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
      width: var(--tile-size);
      flex-shrink: 0;
      cursor: pointer;
      border-radius: var(--radius);
      overflow: visible;
      position: relative;
      transform: scale(0.8);
      transform-origin: top center;
      transition: transform 0.18s ease, filter 0.18s ease;

      &.finished .cover-img {
        filter: brightness(0.5) saturate(0.6);
      }
    }

    .cover-wrap {
      position: relative;
      width: var(--tile-size);
      aspect-ratio: 1;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--bg-card);
    }

    .book-tile[data-kf] {
      outline: none !important;
      transform: scale(1);
      filter: drop-shadow(0 12px 32px rgba(0, 0, 0, 0.85));
      z-index: 10;
    }

    .book-tile[data-kf] .cover-wrap {
      box-shadow: 0 0 0 3px white;
    }

    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      background: var(--bg-card);
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
      width: var(--tile-badge-size);
      height: var(--tile-badge-size);
      background: var(--success);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(34, 197, 94, 0.4);

      i {
        color: white;
        font-size: var(--tile-badge-icon);
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
      font-size: var(--tile-font-title);
      font-weight: 500;
      color: var(--text-primary);
      display: block;
    }

    .book-author {
      font-size: var(--tile-font-author);
      display: block;
    }
  `]
})
export class BookTileComponent implements OnInit {
  @Input({ required: true }) item!: LibraryItem;
  @Input() mediaProgress?: MediaProgress;
  @Output() selected = new EventEmitter<LibraryItem>();
  @Output() focused = new EventEmitter<LibraryItem>();

  coverUrl = '';
  title = '';
  author = '';
  progress = 0;
  isFinished = false;

  constructor(private absService: AudiobookshelfService) {}

  ngOnInit(): void {
    this.coverUrl = this.absService.coverUrl(this.item.id);
    this.title = this.item.media?.metadata?.title ?? '';
    this.author = this.item.media?.metadata?.authors?.map(a => a.name).join(', ') ?? '';

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
    this.selected.emit(this.item);
  }
}
