import { Component, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AudiobookshelfService } from '../../core/services/audiobookshelf.service';
import { FocusService } from '../../core/services/focus.service';
import { BookTileComponent } from '../../shared/components/book-tile/book-tile.component';
import { FocusableDirective } from '../../shared/directives/focusable.directive';
import { LibraryItem } from '../../core/models/abs.models';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, BookTileComponent, FocusableDirective],
  template: `
    <div class="library-page" #scrollContainer>
      <header class="page-header">
        <h1 class="page-title">{{ pageTitle }}</h1>
        @if (total > 0) {
          <p class="count-text">{{ total }} book{{ total !== 1 ? 's' : '' }}</p>
        }
      </header>

      @if (loading && !items.length) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--accent)"></i>
        </div>
      } @else if (!items.length) {
        <div class="empty-state">
          <i class="pi pi-book" style="font-size: 3rem; color: var(--text-muted)"></i>
          <p>No books found</p>
        </div>
      } @else {
        <div class="book-grid" data-focus-zone="grid">
          @for (item of items; track item.id) {
            <app-book-tile [item]="item" (selected)="onBookSelect($event)" />
          }
        </div>

        <div class="sentinel" #sentinel>
          @if (loading) {
            <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: var(--accent)"></i>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .library-page {
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

    .book-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
      gap: 24px;
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

    .sentinel {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 80px;
    }
  `]
})
export class LibraryComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('sentinel') sentinel!: ElementRef<HTMLDivElement>;

  items: LibraryItem[] = [];
  total = 0;
  loading = false;
  page = 0;
  readonly pageSize = 48;

  pageTitle = 'Library';
  libraryId = '';
  seriesFilter = '';

  private observer: IntersectionObserver | null = null;
  private initialized = false;

  constructor(
    private absService: AudiobookshelfService,
    private focusService: FocusService,
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.absService.getLibraries().subscribe(libs => {
      this.libraryId = libs[0]?.id ?? '';
      const seriesId = this.route.snapshot.queryParamMap.get('seriesId');
      if (seriesId) {
        this.seriesFilter = `series.${btoa(seriesId)}`;
        this.pageTitle = this.route.snapshot.queryParamMap.get('seriesName') ?? 'Series';
      }
      this.fetchItems();
    });
  }

  ngAfterViewChecked(): void {
    if (!this.initialized && this.sentinel) {
      this.initialized = true;
      this.setupObserver();
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  get hasMore(): boolean {
    return this.items.length < this.total;
  }

  onBookSelect(item: LibraryItem): void {
    this.router.navigate(['/player', item.id]);
  }

  private setupObserver(): void {
    this.observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting && this.hasMore && !this.loading) {
        this.zone.run(() => {
          this.page++;
          this.fetchItems(true);
        });
      }
    }, { threshold: 0.1 });

    if (this.sentinel) {
      this.observer.observe(this.sentinel.nativeElement);
    }
  }

  private fetchItems(append = false): void {
    if (!this.libraryId) return;
    this.loading = true;

    // For a series view we want ALL books in one page so we can sort them
    // numerically by sequence locally — ABS's API sort on
    // `media.metadata.series.sequence` is a string sort, which puts "10" before "2".
    const isSeries = !!this.seriesFilter;
    const limit = isSeries ? 400 : this.pageSize;
    const sort = isSeries ? 'media.metadata.series.sequence' : 'media.metadata.title';

    this.absService.getLibraryItems(this.libraryId, {
      limit,
      page: this.page,
      sort,
      filter: this.seriesFilter || undefined,
      include: 'progress'
    }).subscribe({
      next: res => {
        this.total = res.total;
        const merged = append ? [...this.items, ...res.results] : res.results;
        this.items = isSeries ? this.sortBySeriesSequence(merged) : merged;
        this.loading = false;
        // When arriving on a series page, drop focus onto the first book.
        if (isSeries && !append) {
          this.focusFirstBookSoon();
        }
      },
      error: () => { this.loading = false; }
    });
  }

  /**
   * Sort books inside a series by their `sequence`. ABS sometimes serializes
   * `media.metadata.series` as an object (when the response is filtered to one
   * series) and sometimes as an array — handle both.
   */
  private sortBySeriesSequence(items: LibraryItem[]): LibraryItem[] {
    return [...items].sort((a, b) => {
      const sa = this.sequenceFor(a);
      const sb = this.sequenceFor(b);
      if (sa === null && sb === null) return 0;
      if (sa === null) return 1;   // unknown sequences sink
      if (sb === null) return -1;
      return sa - sb;
    });
  }

  private focusFirstBookSoon(): void {
    // Defer until Angular renders the tiles so we can grab a real DOM element.
    setTimeout(() => {
      const first = document.querySelector(
        '[data-focus-zone="grid"] [tabindex="0"]'
      ) as HTMLElement | null;
      if (first) this.focusService.focusEl(first);
    }, 50);
  }

  private sequenceFor(item: LibraryItem): number | null {
    const series: unknown = item.media?.metadata?.series;
    let seq: string | undefined;
    if (Array.isArray(series)) {
      seq = series[0]?.sequence;
    } else if (series && typeof series === 'object') {
      seq = (series as { sequence?: string }).sequence;
    }
    if (seq == null || seq === '') return null;
    const n = parseFloat(seq);
    return isFinite(n) ? n : null;
  }
}
