import {
  Component, OnInit, AfterViewChecked, OnDestroy,
  ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { FocusService } from '../../core/services/focus.service';
import { FocusableDirective } from '../../shared/directives/focusable.directive';
import { PlaybackChapter } from '../../core/models/abs.models';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, FocusableDirective],
  template: `
    <div class="player-root">
      <div class="bg-blur" [style.background-image]="'url(' + playerService.coverUrl() + ')'"></div>
      <div class="bg-scrim"></div>

      <div class="player-main">
        @if (playerService.isLoading()) {
          <div class="loading-center">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--accent)"></i>
          </div>
        } @else {
          <div class="artwork">
            <img [src]="playerService.coverUrl()" [alt]="playerService.displayTitle()" class="artwork-img" />
          </div>

          <div class="book-info">
            <h1 class="book-title">{{ playerService.displayTitle() }}</h1>
            <p class="book-author">{{ playerService.displayAuthor() }}</p>
          </div>

          @if (currentChapter) {
            <p class="chapter-name">{{ currentChapter.title }}</p>
          }
          <div class="progress-row">
            <span class="time-label">{{ formatTime(chapterElapsed) }}</span>
            <div class="seekbar-wrap" (click)="onSeekbarClick($event)">
              <div class="seekbar-track">
                <div class="seekbar-fill" [style.width.%]="chapterPercent"></div>
                <div class="seekbar-thumb" [style.left.%]="chapterPercent"></div>
              </div>
            </div>
            <span class="time-label">{{ formatTime(chapterDuration) }}</span>
          </div>

          <div class="book-progress-row">
            <span class="time-label-mini">{{ formatTime(playerService.globalTime()) }}</span>
            <div class="book-progress-track">
              <div class="book-progress-fill" [style.width.%]="seekPercent"></div>
            </div>
            <span class="time-label-mini">{{ formatTime(playerService.duration()) }}</span>
          </div>

          <div class="controls" data-focus-zone="player-controls">
            <button class="ctrl-btn" appFocusable title="Previous chapter" (click)="playerService.prevChapter()">
              <i class="pi pi-step-backward"></i>
            </button>
            <button class="ctrl-btn" appFocusable title="Jump back 10s" (click)="playerService.jumpBack()">
              <i class="pi pi-replay"></i>
              <span class="btn-label">10</span>
            </button>
            <button class="ctrl-btn ctrl-btn--play" appFocusable #playPauseBtn (click)="playerService.togglePlay()">
              <i [class]="playerService.isPlaying() ? 'pi pi-pause' : 'pi pi-play'"></i>
            </button>
            <button class="ctrl-btn" appFocusable title="Jump forward 10s" (click)="playerService.jumpForward()">
              <i class="pi pi-replay icon-flip-x"></i>
              <span class="btn-label">10</span>
            </button>
            <button class="ctrl-btn" appFocusable title="Next chapter" (click)="playerService.nextChapter()">
              <i class="pi pi-step-forward"></i>
            </button>
          </div>
        }
      </div>

      <div class="top-actions" data-focus-zone="player-actions">
        <button class="top-btn" appFocusable title="Chapters" (click)="openSidebar('chapters')">
          <i class="pi pi-list"></i>
        </button>
        <button class="top-btn" appFocusable title="Listen log" (click)="openSidebar('log')">
          <i class="pi pi-history"></i>
        </button>
      </div>

      @if (playerService.sidebarMode() !== 'none') {
        <div class="sidebar" data-focus-zone="sidebar">
          <div class="sidebar-header">
            <h2 class="sidebar-title">{{ playerService.sidebarMode() === 'chapters' ? 'Chapters' : 'Listen Log' }}</h2>
            <button class="sidebar-close" data-sidebar-close (click)="closeSidebar()">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="sidebar-list">
            @if (playerService.sidebarMode() === 'chapters') {
              @for (ch of playerService.chapters(); track ch.id) {
                <div
                  class="sidebar-item"
                  [class.sidebar-item--active]="isCurrentChapter(ch.start)"
                  appFocusable
                  (click)="playerService.seekAndPlay(ch.start)"
                >
                  <span class="sidebar-item-title">{{ ch.title }}</span>
                  <span class="sidebar-item-time">{{ formatTime(ch.start) }}</span>
                </div>
              }
            } @else {
              @for (session of playerService.listenLog(); track session.id) {
                <div class="sidebar-item" appFocusable (click)="playerService.seekAndPlay(session.currentTime)">
                  <span class="sidebar-item-title">{{ formatDate(session.updatedAt) }}</span>
                  <span class="sidebar-item-time">{{ formatTime(session.currentTime) }}</span>
                </div>
              }
              @if (!playerService.listenLog().length) {
                <p class="sidebar-empty">No listening sessions yet.</p>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .player-root {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .bg-blur {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      filter: blur(60px) brightness(0.25) saturate(1.5);
      transform: scale(1.1);
      z-index: 0;
    }

    .bg-scrim {
      position: absolute;
      inset: 0;
      background: rgba(8, 8, 15, 0.5);
      z-index: 1;
    }

    .player-main {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      max-width: 640px;
      width: 100%;
      padding: 32px 24px;
      max-height: 100%;
    }

    .loading-center {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 300px;
    }

    .artwork {
      width: min(calc(100vh - 380px), calc(100vw - 96px), 520px);
      aspect-ratio: 1 / 1;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.8);
      flex-shrink: 0;
    }

    .artwork-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .book-info { text-align: center; }

    .book-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
      line-height: 1.3;
    }

    .book-author {
      font-size: 14px;
      color: var(--text-muted);
    }

    .chapter-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      text-align: center;
      margin: 0;
      padding: 0 12px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .progress-row {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .book-progress-row {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      margin-top: -8px;
      opacity: 0.55;
    }

    .time-label-mini {
      font-size: 10px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
      min-width: 40px;
      text-align: center;
    }

    .book-progress-track {
      flex: 1;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 1px;
      overflow: hidden;
    }

    .book-progress-fill {
      height: 100%;
      background: rgba(255, 255, 255, 0.45);
      border-radius: 1px;
    }

    .time-label {
      font-size: 12px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
      min-width: 40px;
      text-align: center;
    }

    .seekbar-wrap {
      flex: 1;
      padding: 12px 0;
      cursor: pointer;
    }

    .seekbar-track {
      position: relative;
      height: 4px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
    }

    .seekbar-fill {
      position: absolute;
      left: 0; top: 0;
      height: 100%;
      background: var(--accent);
      border-radius: 2px;
      pointer-events: none;
    }

    .seekbar-thumb {
      position: absolute;
      top: 50%;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: white;
      transform: translate(-50%, -50%);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      pointer-events: none;
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .ctrl-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      font-size: 20px;
      transition: background 0.15s;

      &:hover, &[data-kf] {
        background: rgba(255, 255, 255, 0.15);
        outline: 2px solid var(--accent);
        outline-offset: 3px;
      }

      .btn-label {
        position: absolute;
        bottom: 6px;
        right: 6px;
        font-size: 9px;
        font-weight: 700;
        color: var(--text-muted);
        line-height: 1;
      }

      .icon-flip-x { transform: scaleX(-1); }
    }

    .ctrl-btn--play {
      width: 72px;
      height: 72px;
      background: var(--accent);
      font-size: 26px;

      &:hover, &[data-kf] {
        background: var(--accent);
        filter: brightness(1.15);
      }
    }

    .top-actions {
      position: absolute;
      top: 24px;
      right: 24px;
      z-index: 20;
      display: flex;
      gap: 12px;
    }

    .top-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      font-size: 18px;
      transition: background 0.15s;

      &:hover, &[data-kf] {
        background: rgba(255, 255, 255, 0.2);
        outline: 2px solid var(--accent);
        outline-offset: 3px;
      }
    }

    .sidebar {
      position: absolute;
      right: 0; top: 0;
      width: 320px;
      height: 100%;
      background: rgba(15, 15, 26, 0.96);
      border-left: 1px solid var(--border);
      z-index: 30;
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.2s ease-out;
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 16px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .sidebar-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .sidebar-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 16px;

      &:hover, &[data-kf] {
        background: rgba(255, 255, 255, 0.1);
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
    }

    .sidebar-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.1s;

      &:hover, &[data-kf] {
        background: rgba(255, 255, 255, 0.06);
        outline: none;
      }

      &[data-kf] {
        background: rgba(139, 92, 246, 0.15);
        outline: 1px solid var(--accent) !important;
        outline-offset: -1px;
      }

      &.sidebar-item--active .sidebar-item-title { color: var(--accent); }
    }

    .sidebar-item-title {
      font-size: 14px;
      color: var(--text-primary);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 8px;
    }

    .sidebar-item-time {
      font-size: 12px;
      color: var(--text-muted);
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    .sidebar-empty {
      padding: 24px 16px;
      font-size: 14px;
      color: var(--text-muted);
      text-align: center;
    }
  `]
})
export class PlayerComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('playPauseBtn') playPauseBtn!: ElementRef<HTMLButtonElement>;

  private didInitialFocus = false;

  constructor(
    public playerService: PlayerService,
    private focusService: FocusService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const itemId = this.route.snapshot.params['itemId'];
    this.playerService.openItem(itemId);
  }

  ngAfterViewChecked(): void {
    if (!this.didInitialFocus && this.playPauseBtn?.nativeElement) {
      this.didInitialFocus = true;
      this.focusService.focusEl(this.playPauseBtn.nativeElement);
    }
  }

  ngOnDestroy(): void {
    // Audio keeps running in the service — nothing to tear down here.
    this.didInitialFocus = false;
  }

  get seekPercent(): number {
    const dur = this.playerService.duration();
    return dur > 0 ? (this.playerService.globalTime() / dur) * 100 : 0;
  }

  get currentChapter(): PlaybackChapter | null {
    const chapters = this.playerService.chapters();
    if (!chapters.length) return null;
    const t = this.playerService.globalTime();
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (chapters[i].start <= t) return chapters[i];
    }
    return chapters[0];
  }

  get chapterStart(): number { return this.currentChapter?.start ?? 0; }

  get chapterEnd(): number { return this.currentChapter?.end ?? this.playerService.duration(); }

  get chapterElapsed(): number { return Math.max(0, this.playerService.globalTime() - this.chapterStart); }

  get chapterDuration(): number { return Math.max(0, this.chapterEnd - this.chapterStart); }

  get chapterPercent(): number {
    if (this.chapterDuration <= 0) return 0;
    return Math.max(0, Math.min(100, (this.chapterElapsed / this.chapterDuration) * 100));
  }

  onSeekbarClick(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    this.playerService.seekToGlobalTime(this.chapterStart + ratio * this.chapterDuration);
  }

  isCurrentChapter(chStart: number): boolean {
    const ch = this.currentChapter;
    return ch?.start === chStart;
  }

  openSidebar(mode: 'chapters' | 'log'): void {
    this.playerService.toggleSidebar(mode);
    if (this.playerService.sidebarMode() !== 'none') {
      setTimeout(() => {
        const zone = document.querySelector('[data-focus-zone="sidebar"]');
        const first = zone?.querySelector('[tabindex="0"]') as HTMLElement | null;
        if (first) this.focusService.focusEl(first);
      }, 50);
    }
  }

  closeSidebar(): void {
    this.playerService.closeSidebar();
    setTimeout(() => {
      if (this.playPauseBtn) this.focusService.focusEl(this.playPauseBtn.nativeElement);
    }, 50);
  }

  formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  formatDate(ms: number): string {
    return new Date(ms).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  }
}
