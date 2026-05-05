import { Injectable, NgZone, OnDestroy, signal } from '@angular/core';
import { AudiobookshelfService } from './audiobookshelf.service';
import { AudioTrack, ListeningSession, PlaybackChapter, PlaybackSession } from '../models/abs.models';

@Injectable({ providedIn: 'root' })
export class PlayerService implements OnDestroy {
  readonly sessionId      = signal<string | null>(null);
  readonly libraryItemId  = signal('');
  readonly tracks         = signal<AudioTrack[]>([]);
  readonly chapters       = signal<PlaybackChapter[]>([]);
  readonly globalTime     = signal(0);
  readonly duration       = signal(0);
  readonly isPlaying      = signal(false);
  readonly isLoading      = signal(false);
  readonly sidebarMode    = signal<'none' | 'chapters' | 'log'>('none');
  readonly listenLog      = signal<ListeningSession[]>([]);
  readonly displayTitle   = signal('');
  readonly displayAuthor  = signal('');
  readonly coverUrl       = signal('');
  readonly nowPlayingItemId = signal('');
  readonly nowPlayingTitle  = signal('');

  private readonly audio = new Audio();
  private currentTrackIdx = 0;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private syncStartTime = 0;

  constructor(private absService: AudiobookshelfService, private zone: NgZone) {
    this.audio.addEventListener('timeupdate', () => this.zone.run(() => this.onTimeUpdate()));
    this.audio.addEventListener('ended',      () => this.zone.run(() => this.onTrackEnded()));

    window.addEventListener('beforeunload', () => this.doFinalSync());
  }

  ngOnDestroy(): void {
    this.stopSyncInterval();
  }

  /**
   * Open an item for playback. If it's already the active item with a live
   * session, this is a no-op — navigating back to the player page resumes
   * exactly where it left off without touching the audio element.
   */
  openItem(itemId: string): void {
    if (this.libraryItemId() === itemId && this.sessionId()) return;

    if (this.sessionId()) {
      this.doFinalSync();
      this.stopSyncInterval();
    }

    this.isLoading.set(true);

    this.absService.startSession(itemId).subscribe({
      next: session => {
        this.sessionId.set(session.id);
        this.libraryItemId.set(itemId);
        this.tracks.set(session.audioTracks ?? []);
        this.chapters.set(session.chapters ?? []);
        this.duration.set(session.duration);
        this.globalTime.set(session.currentTime ?? 0);

        const title = session.displayTitle ?? (session as unknown as { mediaMetadata?: { title?: string } }).mediaMetadata?.title ?? '';
        this.displayTitle.set(title);
        this.displayAuthor.set(session.displayAuthor ?? '');
        this.coverUrl.set(this.absService.coverUrl(itemId));
        this.nowPlayingItemId.set(itemId);
        this.nowPlayingTitle.set(title);
        this.isLoading.set(false);

        this.absService.getListeningSessions(200, 0).subscribe(r => {
          this.listenLog.set(
            (r.sessions ?? []).filter(s => s.libraryItemId === itemId)
              .sort((a, b) => b.updatedAt - a.updatedAt)
          );
        });

        this.initAudio(session.currentTime ?? 0);
      },
      error: () => this.isLoading.set(false)
    });
  }

  togglePlay(): void {
    if (this.audio.paused) {
      this.audio.play().then(() => this.isPlaying.set(true)).catch(() => {});
    } else {
      this.audio.pause();
      this.isPlaying.set(false);
    }
  }

  jumpBack(): void {
    this.seekToGlobalTime(Math.max(0, this.globalTime() - 10));
  }

  jumpForward(): void {
    this.seekToGlobalTime(Math.min(this.duration(), this.globalTime() + 10));
  }

  prevChapter(): void {
    const chapters = this.chapters();
    if (!chapters.length) { this.seekToGlobalTime(0); return; }
    const t = this.globalTime();
    let idx = -1;
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (chapters[i].start <= t) { idx = i; break; }
    }
    if (idx < 0) idx = 0;
    if (t - chapters[idx].start > 3) {
      this.seekToGlobalTime(chapters[idx].start);
    } else if (idx > 0) {
      this.seekToGlobalTime(chapters[idx - 1].start);
    } else {
      this.seekToGlobalTime(0);
    }
  }

  nextChapter(): void {
    const chapters = this.chapters();
    if (!chapters.length) return;
    const t = this.globalTime();
    const next = chapters.find(ch => ch.start > t);
    if (next) this.seekToGlobalTime(next.start);
  }

  seekToGlobalTime(t: number): void {
    const tracks = this.tracks();
    if (!tracks.length) return;
    const idx = this.trackIndexForTime(t);
    const local = t - tracks[idx].startOffset;
    if (idx === this.currentTrackIdx) {
      this.audio.currentTime = local;
    } else {
      this.switchTrack(idx, local, !this.audio.paused);
    }
  }

  seekAndPlay(t: number): void {
    const tracks = this.tracks();
    if (!tracks.length) return;
    const idx = this.trackIndexForTime(t);
    const local = t - tracks[idx].startOffset;
    if (idx === this.currentTrackIdx) {
      this.audio.currentTime = local;
      this.audio.play().then(() => this.isPlaying.set(true)).catch(() => {});
    } else {
      this.switchTrack(idx, local, true);
    }
  }

  trackIndexForTime(t: number): number {
    const tracks = this.tracks();
    for (let i = 0; i < tracks.length; i++) {
      if (t >= tracks[i].startOffset && t < tracks[i].startOffset + tracks[i].duration) return i;
    }
    return Math.max(0, tracks.length - 1);
  }

  toggleSidebar(mode: 'chapters' | 'log'): void {
    this.sidebarMode.set(this.sidebarMode() === mode ? 'none' : mode);
  }

  closeSidebar(): void {
    this.sidebarMode.set('none');
  }

  stopSyncInterval(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private initAudio(startTime: number): void {
    const tracks = this.tracks();
    if (!tracks.length) return;

    this.currentTrackIdx = this.trackIndexForTime(startTime);
    const track = tracks[this.currentTrackIdx];
    this.audio.src = this.absService.audioStreamUrl(track.contentUrl);

    this.audio.addEventListener('canplay', () => {
      this.zone.run(() => {
        this.audio.currentTime = Math.max(0, startTime - track.startOffset);
        this.startSyncInterval();
        this.audio.play().then(() => this.isPlaying.set(true)).catch(() => {});
      });
    }, { once: true });
  }

  private switchTrack(idx: number, localOffset: number, shouldPlay: boolean): void {
    const tracks = this.tracks();
    if (idx >= tracks.length) { this.isPlaying.set(false); return; }

    this.currentTrackIdx = idx;
    this.audio.src = this.absService.audioStreamUrl(tracks[idx].contentUrl);

    this.audio.addEventListener('canplay', () => {
      this.zone.run(() => {
        this.audio.currentTime = localOffset;
        if (shouldPlay) this.audio.play().then(() => this.isPlaying.set(true)).catch(() => {});
      });
    }, { once: true });
  }

  private onTimeUpdate(): void {
    const tracks = this.tracks();
    if (!tracks.length) return;
    const track = tracks[this.currentTrackIdx];
    const gt = track.startOffset + this.audio.currentTime;
    this.globalTime.set(gt);

    if (this.audio.currentTime >= track.duration && this.currentTrackIdx < tracks.length - 1) {
      this.switchTrack(this.currentTrackIdx + 1, 0, true);
    }
  }

  private onTrackEnded(): void {
    if (this.currentTrackIdx < this.tracks().length - 1) {
      this.switchTrack(this.currentTrackIdx + 1, 0, true);
    } else {
      this.isPlaying.set(false);
    }
  }

  private startSyncInterval(): void {
    this.syncStartTime = this.globalTime();
    this.syncInterval = setInterval(() => {
      const id = this.sessionId();
      if (!id) return;
      this.absService.syncSession(id, this.globalTime(), 5, this.duration()).subscribe();
    }, 5000);
  }

  private doFinalSync(): void {
    const id = this.sessionId();
    if (!id) return;
    const t = this.globalTime();
    const elapsed = t - this.syncStartTime;
    this.absService.syncSession(id, t, elapsed, this.duration()).subscribe();
    this.absService.closeSession(id, t, elapsed, this.duration()).subscribe();
    this.sessionId.set(null);
  }
}
