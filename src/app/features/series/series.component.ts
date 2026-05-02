import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AudiobookshelfService } from '../../core/services/audiobookshelf.service';
import { SeriesTileComponent } from '../../shared/components/series-tile/series-tile.component';
import { FocusableDirective } from '../../shared/directives/focusable.directive';
import { Series } from '../../core/models/abs.models';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-series',
  standalone: true,
  imports: [CommonModule, SeriesTileComponent, FocusableDirective, ButtonModule],
  template: `
    <div class="series-page">
      <header class="page-header">
        <h1 class="page-title">Series</h1>
        @if (total > 0) {
          <p class="count-text">{{ total }} series</p>
        }
      </header>

      @if (loading && !series.length) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--accent)"></i>
        </div>
      } @else if (!series.length) {
        <div class="empty-state">
          <i class="pi pi-th-large" style="font-size: 3rem; color: var(--text-muted)"></i>
          <p>No series found</p>
        </div>
      } @else {
        <div class="series-list">
          @for (s of series; track s.id) {
            <div class="series-row" (click)="onSeriesSelect(s)" (keydown.enter)="onSeriesSelect(s)" appFocusable>
              <div class="fan-section">
                <div class="fan-wrap">
                  @for (cover of getCovers(s); track cover; let i = $index) {
                    <img
                      [src]="cover"
                      [alt]="s.name"
                      class="fan-cover"
                      [style]="getFanStyle(i, getCovers(s).length)"
                      (error)="onImgError($event)"
                      loading="lazy"
                    />
                  }
                  @if (!getCovers(s).length) {
                    <div class="fan-placeholder">
                      <i class="pi pi-book"></i>
                    </div>
                  }
                </div>
              </div>

              <div class="series-info">
                <h2 class="series-name">{{ s.name }}</h2>
                <p class="series-count text-muted">{{ s.numBooks }} book{{ s.numBooks !== 1 ? 's' : '' }}</p>
                @if (s.books && s.books.length) {
                  <p class="series-authors text-secondary">
                    {{ getAuthors(s) }}
                  </p>
                }
              </div>

              <div class="series-action">
                <i class="pi pi-chevron-right" style="color: var(--text-muted)"></i>
              </div>
            </div>
          }
        </div>

        @if (hasMore) {
          <div class="load-more">
            <p-button
              label="Load More"
              [outlined]="true"
              [loading]="loading"
              (onClick)="loadMore()"
              appFocusable
            />
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .series-page {
      height: 100%;
      overflow-y: auto;
      padding: 40px 48px;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-title {
      font-size: 32px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .count-text {
      font-size: 13px;
      color: var(--text-muted);
    }

    .series-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .series-row {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 20px 16px;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.15s;

      &:hover, &:focus-visible {
        background: var(--bg-hover);
        outline: 2px solid var(--accent);
        outline-offset: -2px;
      }
    }

    .fan-section {
      flex-shrink: 0;
    }

    .fan-wrap {
      position: relative;
      width: 200px;
      height: 120px;
    }

    .fan-cover {
      position: absolute;
      width: 75px;
      height: 112px;
      object-fit: cover;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      top: 4px;
    }

    .fan-placeholder {
      width: 80px;
      height: 112px;
      background: var(--bg-card);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      i { font-size: 24px; }
    }

    .series-info {
      flex: 1;
      min-width: 0;
    }

    .series-name {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .series-count {
      font-size: 13px;
      margin-bottom: 6px;
    }

    .series-authors {
      font-size: 13px;
    }

    .series-action {
      flex-shrink: 0;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      height: 400px;
      color: var(--text-muted);
    }

    .load-more {
      display: flex;
      justify-content: center;
      padding: 32px 0;
    }
  `]
})
export class SeriesComponent implements OnInit {
  series: Series[] = [];
  total = 0;
  loading = false;
  page = 0;
  libraryId = '';

  private readonly FAN_ROTATIONS = [-16, -6, 5, 16];
  private readonly FAN_LEFT = [0, 30, 62, 96];
  private readonly FAN_TOP = [8, 3, 0, 6];

  constructor(
    private absService: AudiobookshelfService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.absService.getLibraries().subscribe(libs => {
      this.libraryId = libs[0]?.id ?? '';
      this.fetchSeries();
    });
  }

  get hasMore(): boolean {
    return this.series.length < this.total;
  }

  getCovers(s: Series): string[] {
    return (s.books ?? []).slice(0, 4).map(b => this.absService.coverUrl(b.id));
  }

  getFanStyle(index: number, total: number): string {
    const rot = this.FAN_ROTATIONS[index] ?? (index - (total - 1) / 2) * 10;
    const left = this.FAN_LEFT[index] ?? index * 30;
    const top = this.FAN_TOP[index] ?? 0;
    const brightness = 0.55 + (index / Math.max(total - 1, 1)) * 0.45;
    return `transform: rotate(${rot}deg); left: ${left}px; top: ${top}px; filter: brightness(${brightness});`;
  }

  getAuthors(s: Series): string {
    const names = new Set<string>();
    s.books?.forEach(b => b.media?.metadata?.authors?.forEach(a => names.add(a.name)));
    return Array.from(names).slice(0, 3).join(', ');
  }

  onSeriesSelect(s: Series): void {
    this.router.navigate(['/library'], {
      queryParams: { seriesId: s.id, seriesName: s.name }
    });
  }

  loadMore(): void {
    this.page++;
    this.fetchSeries(true);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/cover-placeholder.svg';
  }

  private fetchSeries(append = false): void {
    if (!this.libraryId) return;
    this.loading = true;

    this.absService.getSeries(this.libraryId, {
      limit: 40,
      page: this.page,
      sort: 'name'
    }).subscribe({
      next: res => {
        this.total = res.total;
        this.series = append ? [...this.series, ...res.results] : res.results;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
