import { Injectable, signal } from '@angular/core';
import { Observable, switchMap, tap, shareReplay } from 'rxjs';
import { AudiobookshelfService } from './audiobookshelf.service';
import { AudioTrack, ListeningSession, PlaybackChapter, PlaybackSession } from '../models/abs.models';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  readonly sessionId = signal<string | null>(null);
  readonly libraryItemId = signal('');
  readonly tracks = signal<AudioTrack[]>([]);
  readonly chapters = signal<PlaybackChapter[]>([]);
  readonly globalTime = signal(0);
  readonly duration = signal(0);
  readonly isPlaying = signal(false);
  readonly isLoading = signal(false);
  readonly sidebarMode = signal<'none' | 'chapters' | 'log'>('none');
  readonly listenLog = signal<ListeningSession[]>([]);
  readonly displayTitle = signal('');
  readonly displayAuthor = signal('');
  readonly coverUrl = signal('');

  /** Persists across player component destroy so the Nav can show a "Now Playing" link. */
  readonly nowPlayingItemId = signal('');
  readonly nowPlayingTitle = signal('');

  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private syncStartTime = 0;

  load(itemId: string, absService: AudiobookshelfService): Observable<PlaybackSession> {
    this.isLoading.set(true);
    // shareReplay ensures the HTTP call fires exactly once even if multiple subscribers attach.
    return absService.startSession(itemId).pipe(
      tap({
        next: session => {
          this.sessionId.set(session.id);
          this.libraryItemId.set(itemId);
          this.tracks.set(session.audioTracks ?? []);
          this.chapters.set(session.chapters ?? []);
          this.duration.set(session.duration);
          this.globalTime.set(session.currentTime ?? 0);
          const title = session.displayTitle ?? session.mediaMetadata?.title ?? '';
          this.displayTitle.set(title);
          this.displayAuthor.set(session.displayAuthor ?? '');
          this.coverUrl.set(absService.coverUrl(itemId));
          this.nowPlayingItemId.set(itemId);
          this.nowPlayingTitle.set(title);
          this.isLoading.set(false);

          absService.getListeningSessions(200, 0).subscribe(r => {
            this.listenLog.set(
              (r.sessions ?? []).filter(s => s.libraryItemId === itemId)
                .sort((a, b) => b.updatedAt - a.updatedAt)
            );
          });
        },
        error: () => this.isLoading.set(false)
      }),
      shareReplay(1)
    );
  }

  startSyncInterval(getTime: () => number, absService: AudiobookshelfService): void {
    this.syncStartTime = getTime();
    this.syncInterval = setInterval(() => {
      const id = this.sessionId();
      if (!id) return;
      const t = getTime();
      absService.syncSession(id, t, 5, this.duration()).subscribe();
    }, 5000);
  }

  stopSyncInterval(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  finalSync(getTime: () => number, absService: AudiobookshelfService): Observable<void> {
    const id = this.sessionId() ?? '';
    const t = getTime();
    const elapsed = t - this.syncStartTime;
    return absService.syncSession(id, t, elapsed, this.duration()).pipe(
      switchMap(() => absService.closeSession(id, t, elapsed, this.duration()))
    );
  }

  updateGlobalTime(t: number): void {
    this.globalTime.set(t);
  }

  trackIndexForTime(t: number): number {
    const tracks = this.tracks();
    for (let i = 0; i < tracks.length; i++) {
      if (t >= tracks[i].startOffset && t < tracks[i].startOffset + tracks[i].duration) {
        return i;
      }
    }
    return Math.max(0, tracks.length - 1);
  }

  toggleSidebar(mode: 'chapters' | 'log'): void {
    this.sidebarMode.set(this.sidebarMode() === mode ? 'none' : mode);
  }

  closeSidebar(): void {
    this.sidebarMode.set('none');
  }

  reset(): void {
    this.stopSyncInterval();
    this.sessionId.set(null);
    this.libraryItemId.set('');
    this.tracks.set([]);
    this.chapters.set([]);
    this.globalTime.set(0);
    this.duration.set(0);
    this.isPlaying.set(false);
    this.isLoading.set(false);
    this.sidebarMode.set('none');
    this.listenLog.set([]);
    this.displayTitle.set('');
    this.displayAuthor.set('');
    this.coverUrl.set('');
  }
}
