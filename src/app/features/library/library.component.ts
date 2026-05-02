import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { switchMap, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AudiobookshelfService } from '../../core/services/audiobookshelf.service';
import { BookTileComponent } from '../../shared/components/book-tile/book-tile.component';
import { FocusableDirective } from '../../shared/directives/focusable.directive';
import { LibraryItem } from '../../core/models/abs.models';

interface SortOption { label: string; value: string }

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    InputTextModule,
    ButtonModule,
    BookTileComponent,
    FocusableDirective
  ],
  template: `
    <div class="library-page">
      <header class="page-header">
        <div class="header-top">
          <div>
            <h1 class="page-title">{{ pageTitle }}</h1>
            @if (total > 0) {
              <p class="count-text">{{ total }} book{{ total !== 1 ? 's' : '' }}</p>
            }
          </div>
          <div class="controls">
            <div class="search-wrap">
              <i class="pi pi-search search-icon"></i>
              <input
                pInputText
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search books..."
                (ngModelChange)="onSearch($event)"
                appFocusable
                class="search-input"
              />
            </div>

            <p-dropdown
              [options]="sortOptions"
              [(ngModel)]="selectedSort"
              optionLabel="label"
              (onChange)="onSortChange()"
              appFocusable
            />

            <p-button
              [icon]="sortDesc ? 'pi pi-sort-amount-down' : 'pi pi-sort-amount-up'"
              [text]="true"
              (onClick)="toggleSortDir()"
              appFocusable
              pTooltip="Toggle direction"
            />
          </div>
        </div>
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
        <div class="book-grid">
          @for (item of items; track item.id) {
            <app-book-tile [item]="item" />
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
    .library-page {
      height: 100%;
      overflow-y: auto;
      padding: 40px 48px;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
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

    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-wrap {
      position: relative;

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        pointer-events: none;
        font-size: 14px;
      }

      .search-input {
        padding-left: 36px !important;
        width: 220px;
      }
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

    .load-more {
      display: flex;
      justify-content: center;
      padding: 32px 0;
    }
  `]
})
export class LibraryComponent implements OnInit {
  items: LibraryItem[] = [];
  total = 0;
  loading = false;
  page = 0;
  readonly pageSize = 48;

  searchQuery = '';
  selectedSort: SortOption = { label: 'Title', value: 'media.metadata.title' };
  sortDesc = false;

  pageTitle = 'Library';
  libraryId = '';
  seriesFilter = '';

  private search$ = new Subject<string>();

  sortOptions: SortOption[] = [
    { label: 'Title', value: 'media.metadata.title' },
    { label: 'Author', value: 'media.metadata.authorNameLF' },
    { label: 'Added', value: 'addedAt' },
    { label: 'Duration', value: 'media.duration' },
    { label: 'Progress', value: 'progress' },
  ];

  constructor(
    private absService: AudiobookshelfService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page = 0;
      this.items = [];
      this.fetchItems();
    });

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

  get hasMore(): boolean {
    return this.items.length < this.total;
  }

  onSearch(val: string): void {
    this.search$.next(val);
  }

  onSortChange(): void {
    this.page = 0;
    this.items = [];
    this.fetchItems();
  }

  toggleSortDir(): void {
    this.sortDesc = !this.sortDesc;
    this.page = 0;
    this.items = [];
    this.fetchItems();
  }

  loadMore(): void {
    this.page++;
    this.fetchItems(true);
  }

  private fetchItems(append = false): void {
    if (!this.libraryId) return;
    this.loading = true;

    this.absService.getLibraryItems(this.libraryId, {
      limit: this.pageSize,
      page: this.page,
      sort: this.selectedSort.value,
      desc: this.sortDesc,
      filter: this.seriesFilter || undefined,
      search: this.searchQuery || undefined,
      include: 'progress'
    }).subscribe({
      next: res => {
        this.total = res.total;
        this.items = append ? [...this.items, ...res.results] : res.results;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
