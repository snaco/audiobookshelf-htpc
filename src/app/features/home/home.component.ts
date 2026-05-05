import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { ProgressBarModule } from 'primeng/progressbar';
import { AudiobookshelfService } from '../../core/services/audiobookshelf.service';
import { AuthService } from '../../core/services/auth.service';
import { ScrollableRowComponent } from '../../shared/components/scrollable-row/scrollable-row.component';
import { BookTileComponent } from '../../shared/components/book-tile/book-tile.component';
import { LibraryItem, MediaProgress, PersonalizedShelf } from '../../core/models/abs.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ScrollableRowComponent, BookTileComponent, ProgressBarModule],
  template: `
    <div class="home-page">

      @if (heroItem) {
        <div class="hero-section">
          <div class="hero-bg"
               [style.background-image]="'url(' + absService.coverUrl(heroItem.id) + ')'"></div>
          <div class="hero-content">
            <img
              class="hero-cover"
              [src]="absService.coverUrl(heroItem.id)"
              [alt]="heroItem.media.metadata.title"
              (error)="onHeroImgError($event)"
            />
            <div class="hero-info">
              <h2 class="hero-title">{{ heroItem.media.metadata.title }}</h2>
              <div class="hero-badges">
                @for (a of heroItem.media.metadata.authors ?? []; track a.id) {
                  <span class="hero-badge author"><i class="pi pi-user"></i>{{ a.name }}</span>
                }
                @for (n of heroItem.media.metadata.narrators ?? []; track n) {
                  <span class="hero-badge narrator"><i class="pi pi-microphone"></i>{{ n }}</span>
                }
              </div>
              @if (heroItem.media.metadata.description) {
                <p class="hero-synopsis">{{ stripHtml(heroItem.media.metadata.description) }}</p>
              }
              <div class="hero-progress-section">
                @if (heroProgress && heroProgress.progress > 0) {
                  <p-progressBar [value]="heroProgress.progress * 100" [showValue]="false" />
                  <div class="hero-progress-meta">
                    <span>{{ formatTime(heroProgress.currentTime) }} / {{ formatTime(heroItem.media.duration) }}</span>
                    @if (heroItem.media.chapters?.length) {
                      <span>Chapter {{ currentChapterIndex(heroItem, heroProgress.currentTime) + 1 }} of {{ heroItem.media.chapters.length }}</span>
                    }
                  </div>
                } @else {
                  <div class="not-started">
                    <span class="not-started-label">Not Started</span>
                    <span class="not-started-duration">{{ formatTime(heroItem.media.duration) }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <div class="scrollable-content">
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
                      (selected)="onBookSelect($event)"
                      (focused)="onBookFocus($event)"
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
    </div>
  `,
  styles: [`
    .home-page {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .scrollable-content {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 32px 48px 40px;
    }

    .hero-section {
      position: relative;
      height: clamp(240px, 33vh, 500px);
      border-radius: 0;
      overflow: hidden;
      flex-shrink: 0;
    }

    .hero-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      filter: blur(40px) brightness(0.3) saturate(1.4);
      transform: scale(1.1);
    }

    .hero-content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 32px;
      height: 100%;
      padding: 24px 32px;
    }

    .hero-cover {
      height: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: var(--radius);
      flex-shrink: 0;
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.8);
    }

    .hero-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
    }

    .hero-title {
      font-size: clamp(22px, 2.5vw, 52px);
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      line-height: 1.1;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      word-break: break-word;
    }

    .hero-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 8px;
      margin: 2px 0;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: clamp(11px, 0.75vw, 16px);
      font-weight: 500;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-secondary);
      white-space: nowrap;

      i { font-size: 0.85em; }
    }

    .hero-badge.author { color: var(--accent-bright); }
    .hero-badge.narrator { color: var(--text-secondary); }

    .not-started {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }

    .not-started-label {
      font-size: clamp(13px, 0.9vw, 20px);
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent-bright);
    }

    .not-started-duration {
      font-size: clamp(11px, 0.75vw, 16px);
      color: var(--text-muted);
    }

    .hero-synopsis {
      font-size: clamp(12px, 0.9vw, 18px);
      color: var(--text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }

    .hero-progress-section {
      margin-top: 4px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 420px;
    }

    .hero-progress-meta {
      display: flex;
      justify-content: space-between;
      font-size: clamp(11px, 0.75vw, 16px);
      color: var(--text-muted);
    }

    .page-header {
      margin-bottom: 40px;
    }

    .page-title {
      font-size: var(--font-page-title);
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }

    .page-subtitle {
      font-size: var(--font-page-subtitle);
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
  heroItem: LibraryItem | null = null;
  heroProgress: MediaProgress | null = null;
  loading = true;
  greeting = '';
  username = '';

  private readonly SHELF_ORDER = ['continue-listening', 'continue-series', 'recommended', 'recently-added'];

  constructor(
    protected absService: AudiobookshelfService,
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
        this.computeHero();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  shelfItems(shelf: PersonalizedShelf): LibraryItem[] {
    return (shelf.entities as LibraryItem[]).filter(e => e.media?.metadata?.title);
  }

  onBookSelect(item: LibraryItem): void {
    this.router.navigate(['/player', item.id]);
  }

  formatTime(seconds: number): string {
    if (!seconds || seconds < 60) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  currentChapterIndex(item: LibraryItem, currentTime: number): number {
    const chapters = item.media?.chapters ?? [];
    const idx = chapters.findIndex(c => currentTime >= c.start && currentTime < c.end);
    return idx === -1 ? (currentTime > 0 ? chapters.length - 1 : 0) : idx;
  }

  private progressFor(item: LibraryItem): MediaProgress | null {
    if (item.userMediaProgress) return item.userMediaProgress;
    const stored = this.auth.user()?.mediaProgress?.find(p => p.libraryItemId === item.id);
    return stored ?? null;
  }

  heroAuthors(item: LibraryItem): string {
    return item.media?.metadata?.authors?.map(a => a.name).join(', ') ?? '';
  }

  onHeroImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/cover-placeholder.svg';
  }

  onBookFocus(item: LibraryItem): void {
    this.heroItem = item;
    this.heroProgress = this.progressFor(item);
  }

  stripHtml(s: string | null | undefined): string {
    return (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private computeHero(): void {
    const cl = this.shelves.find(s => s.id === 'continue-listening');
    const ra = this.shelves.find(s => s.id === 'recently-added');
    const candidates = (cl?.entities ?? ra?.entities ?? []) as LibraryItem[];
    this.heroItem = candidates.find(e => e.media?.metadata?.title) ?? null;
    this.heroProgress = this.heroItem ? this.progressFor(this.heroItem) : null;
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
