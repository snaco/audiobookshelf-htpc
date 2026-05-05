import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AudiobookshelfService } from '../../core/services/audiobookshelf.service';
import { FocusableDirective } from '../../shared/directives/focusable.directive';
import { Series } from '../../core/models/abs.models';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-series',
  standalone: true,
  imports: [CommonModule, FocusableDirective, ButtonModule],
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
        <div data-focus-zone="grid">
          <div class="series-grid">
            @for (s of series; track s.id) {
              <div class="series-card" appFocusable
                   (click)="onSeriesSelect(s)" (keydown.enter)="onSeriesSelect(s)">
                <div class="fan-wrap">
                  @for (cover of getCovers(s); track cover; let i = $index) {
                    <img
                      [src]="cover"
                      [alt]="s.name"
                      class="fan-cover"
                      [style]="getSpreadStyle(i, getCovers(s).length)"
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
                <div class="series-meta">
                  <span class="series-name truncate">{{ s.name }}</span>
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
        </div>
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
      font-size: var(--font-page-title);
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .count-text {
      font-size: var(--font-count);
      color: var(--text-muted);
    }

    .series-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
    }

    .series-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      border-radius: var(--radius);
      padding: 16px;
      overflow: visible;
      position: relative;
      transform: scale(0.8);
      transform-origin: top center;
      transition: transform 0.18s ease, filter 0.18s ease;
    }

    .series-card[data-kf] {
      outline: none !important;
      transform: scale(1);
      filter: drop-shadow(0 12px 32px rgba(0, 0, 0, 0.85));
      z-index: 10;
    }

    .series-card[data-kf] .fan-wrap {
      box-shadow: 0 0 0 3px white;
      border-radius: 8px;
    }

    .fan-wrap {
      position: relative;
      width: var(--series-fan-wrap-w);
      height: var(--series-fan-wrap-h);
      margin-bottom: 16px;
    }

    .fan-cover {
      position: absolute;
      width: var(--series-fan-cover-w);
      height: var(--series-fan-cover-h);
      object-fit: cover;
      border-radius: 6px;
      bottom: 0;
      box-shadow: -6px 4px 14px rgba(0, 0, 0, 0.7);
    }

    .fan-placeholder {
      width: var(--series-fan-cover-w);
      height: var(--series-fan-cover-h);
      background: var(--bg-card);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
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
      font-size: var(--tile-font-title);
      font-weight: 600;
      color: var(--text-primary);
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

  getSpreadStyle(index: number, total: number): string {
    const ratio = total > 1 ? index / (total - 1) : 0.5;
    const z = total - index;
    return `left: calc((var(--series-fan-wrap-w) - var(--series-fan-cover-w)) * ${ratio}); z-index: ${z};`;
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
