import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FocusableDirective } from '../../directives/focusable.directive';
import { Series } from '../../../core/models/abs.models';
import { AudiobookshelfService } from '../../../core/services/audiobookshelf.service';

@Component({
  selector: 'app-series-tile',
  standalone: true,
  imports: [CommonModule, FocusableDirective],
  template: `
    <div
      class="series-tile"
      appFocusable
      (click)="onSelect()"
      (keydown.enter)="onSelect()"
    >
      <div class="fan-wrap">
        @for (cover of fanCovers; track cover; let i = $index) {
          <img
            [src]="cover"
            [alt]="series.name"
            class="fan-cover"
            [style.z-index]="i + 1"
            [style.transform]="getFanTransform(i, fanCovers.length)"
            (error)="onImgError($event)"
            loading="lazy"
          />
        }
        @if (!fanCovers.length) {
          <div class="fan-placeholder">
            <i class="pi pi-book"></i>
          </div>
        }
      </div>

      <div class="series-meta">
        <span class="series-name truncate">{{ series.name }}</span>
        <span class="series-count text-muted">{{ series.numBooks }} book{{ series.numBooks !== 1 ? 's' : '' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .series-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 180px;
      flex-shrink: 0;
      cursor: pointer;
      overflow: visible;
      position: relative;
      transform: scale(0.8);
      transform-origin: top center;
      transition: transform 0.18s ease, filter 0.18s ease;
    }

    .series-tile[data-kf] {
      outline: none !important;
      transform: scale(1);
      filter: drop-shadow(0 12px 32px rgba(0, 0, 0, 0.85));
      z-index: 10;
    }

    .series-tile[data-kf] .fan-wrap {
      box-shadow: 0 0 0 3px white;
      border-radius: 8px;
    }

    .fan-wrap {
      position: relative;
      width: 160px;
      height: 200px;
      margin-bottom: 12px;
    }

    .fan-cover {
      position: absolute;
      width: 120px;
      height: 180px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
      top: 10px;
      left: 20px;
    }

    .fan-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-card);
      border-radius: var(--radius);
      color: var(--text-muted);

      i { font-size: 36px; }
    }

    .series-meta {
      width: 100%;
      text-align: center;
      padding: 0 4px;
    }

    .series-name {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .series-count {
      display: block;
      font-size: 11px;
      margin-top: 2px;
    }
  `]
})
export class SeriesTileComponent implements OnInit {
  @Input({ required: true }) series!: Series;

  fanCovers: string[] = [];

  private readonly FAN_ROTATIONS = [-14, -6, 3, 12];
  private readonly FAN_OFFSETS_X = [-18, -8, 4, 16];
  private readonly FAN_OFFSETS_Y = [8, 4, 0, 6];

  constructor(private absService: AudiobookshelfService) {}

  ngOnInit(): void {
    const books = this.series.books?.slice(0, 4) ?? [];
    this.fanCovers = books.map(b => this.absService.coverUrl(b.id));
  }

  getFanTransform(index: number, total: number): string {
    const mid = (total - 1) / 2;
    const r = this.FAN_ROTATIONS[index] ?? (index - mid) * 8;
    const ox = this.FAN_OFFSETS_X[index] ?? (index - mid) * 10;
    const oy = this.FAN_OFFSETS_Y[index] ?? 0;
    const brightness = 0.6 + (index / Math.max(total - 1, 1)) * 0.4;
    return `rotate(${r}deg) translate(${ox}px, ${oy}px)`;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/cover-placeholder.svg';
  }

  onSelect(): void {}
}
