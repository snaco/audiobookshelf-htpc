import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { AudiobookshelfService } from '../../core/services/audiobookshelf.service';
import { AuthService } from '../../core/services/auth.service';
import { ScrollableRowComponent } from '../../shared/components/scrollable-row/scrollable-row.component';
import { BookTileComponent } from '../../shared/components/book-tile/book-tile.component';
import { LibraryItem, PersonalizedShelf } from '../../core/models/abs.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ScrollableRowComponent, BookTileComponent],
  template: `
    <div class="home-page">
      <header class="page-header">
        <h1 class="page-title">Good {{ greeting }}, {{ username }}</h1>
        <p class="page-subtitle">Pick up where you left off</p>
      </header>

      @if (loading) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--accent)"></i>
        </div>
      } @else {
        <div class="shelves" data-focus-zone="grid">
          @for (shelf of shelves; track shelf.id) {
            @if (shelfItems(shelf).length > 0) {
              <app-scrollable-row [title]="shelf.label">
                @for (item of shelfItems(shelf); track item.id) {
                  <app-book-tile
                    [item]="item"
                    (click)="onBookSelect(item)"
                  />
                }
              </app-scrollable-row>
            }
          }

          @if (!shelves.length && !loading) {
            <div class="empty-state">
              <i class="pi pi-book" style="font-size: 3rem; color: var(--text-muted)"></i>
              <p>No books found. Add some books to your library to get started.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .home-page {
      height: 100%;
      overflow-y: auto;
      padding: 40px 48px;
    }

    .page-header {
      margin-bottom: 40px;
    }

    .page-title {
      font-size: 32px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }

    .page-subtitle {
      font-size: 15px;
      color: var(--text-muted);
    }

    .shelves {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      height: 300px;
      color: var(--text-muted);
    }
  `]
})
export class HomeComponent implements OnInit {
  shelves: PersonalizedShelf[] = [];
  loading = true;
  greeting = '';
  username = '';

  private readonly SHELF_ORDER = ['continue-listening', 'continue-series', 'recommended', 'recently-added'];

  constructor(
    private absService: AudiobookshelfService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const hour = new Date().getHours();
    this.greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    this.username = this.auth.user()?.username ?? '';

    this.absService.getLibraries().pipe(
      switchMap(libs => {
        const defaultLib = libs[0];
        if (!defaultLib) return [];
        return this.absService.getPersonalizedShelves(defaultLib.id);
      })
    ).subscribe({
      next: shelves => {
        this.shelves = this.sortShelves(shelves);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  shelfItems(shelf: PersonalizedShelf): LibraryItem[] {
    return (shelf.entities as LibraryItem[]).filter(e => e.media?.metadata?.title);
  }

  onBookSelect(item: LibraryItem): void {
    // Future: open book detail / player
  }

  private sortShelves(shelves: PersonalizedShelf[]): PersonalizedShelf[] {
    return [...shelves].sort((a, b) => {
      const ai = this.SHELF_ORDER.indexOf(a.id);
      const bi = this.SHELF_ORDER.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }
}
