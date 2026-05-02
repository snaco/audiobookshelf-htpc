import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { forkJoin } from 'rxjs';
import { AudiobookshelfService } from '../../core/services/audiobookshelf.service';
import { AuthService } from '../../core/services/auth.service';
import { ListeningSession, MediaProgress } from '../../core/models/abs.models';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  template: `
    <div class="stats-page">
      <header class="page-header">
        <h1 class="page-title">Your Stats</h1>
        <p class="page-subtitle">Listening history and progress</p>
      </header>

      @if (loading) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--accent)"></i>
        </div>
      } @else {
        <div class="stat-cards">
          @for (card of statCards; track card.label) {
            <div class="stat-card">
              <div class="stat-icon" [style.background]="card.color + '22'">
                <i [class]="'pi ' + card.icon" [style.color]="card.color"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ card.value }}</span>
                <span class="stat-label">{{ card.label }}</span>
              </div>
            </div>
          }
        </div>

        <div class="charts-grid">
          <div class="chart-card wide">
            <h3 class="chart-title">Listening Time (last 12 months)</h3>
            <div echarts [options]="listeningTimeChart" class="chart"></div>
          </div>

          <div class="chart-card">
            <h3 class="chart-title">Genre Distribution</h3>
            <div echarts [options]="genreChart" class="chart"></div>
          </div>

          <div class="chart-card">
            <h3 class="chart-title">Books Completed by Month (last 2 years)</h3>
            <div echarts [options]="booksCompletedChart" class="chart"></div>
          </div>
        </div>

        @if (inProgress.length > 0) {
          <div class="in-progress-section">
            <h3 class="section-title">In Progress</h3>
            <div class="progress-list">
              @for (item of inProgress; track item.libraryItemId) {
                <div class="progress-item">
                  <div class="progress-info">
                    <span class="progress-title">{{ item.title }}</span>
                    <span class="progress-pct text-muted">{{ formatPct(item.progress) }}</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" [style.width]="formatPct(item.progress)"></div>
                  </div>
                  <span class="progress-time text-muted">{{ formatTime(item.timeLeft) }} left</span>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .stats-page {
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
      margin-bottom: 6px;
    }

    .page-subtitle {
      font-size: 15px;
      color: var(--text-muted);
    }

    .stat-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 22px;
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: auto;
      gap: 20px;
      margin-bottom: 32px;
    }

    .chart-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;

      &.wide {
        grid-column: 1 / -1;
      }
    }

    .chart-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 20px;
    }

    .chart {
      height: 240px;
    }

    .in-progress-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 20px;
    }

    .progress-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .progress-item {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      gap: 6px;
      align-items: center;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .progress-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .progress-pct {
      font-size: 12px;
      font-weight: 600;
    }

    .progress-track {
      grid-column: 1;
      height: 4px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--accent);
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .progress-time {
      grid-column: 2;
      grid-row: 1 / 3;
      font-size: 12px;
      padding-left: 16px;
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 400px;
    }
  `]
})
export class StatsComponent implements OnInit {
  loading = true;
  statCards: StatCard[] = [];
  inProgress: { libraryItemId: string; title: string; progress: number; timeLeft: number }[] = [];

  listeningTimeChart: EChartsOption = {};
  genreChart: EChartsOption = {};
  booksCompletedChart: EChartsOption = {};

  private chartDefaults = {
    backgroundColor: 'transparent',
    textStyle: { color: '#94a3b8', fontFamily: 'Inter, system-ui' },
    tooltip: {
      backgroundColor: '#1a1a2a',
      borderColor: 'rgba(255,255,255,0.07)',
      textStyle: { color: '#f1f5f9' }
    }
  };

  constructor(
    private absService: AudiobookshelfService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    forkJoin({
      user: this.absService.getCurrentUser(),
      sessions: this.absService.getListeningSessions(200, 0),
      libraries: this.absService.getLibraries()
    }).pipe().subscribe({
      next: ({ user, sessions, libraries }) => {
        const allProgress = user.mediaProgress ?? [];
        const allSessions = sessions.sessions ?? [];

        this.buildStatCards(allProgress, allSessions);
        this.buildListeningTimeChart(allSessions);
        this.buildBooksCompletedChart(allProgress);

        if (libraries.length) {
          this.absService.getLibraryItems(libraries[0].id, { limit: 500, include: 'progress' }).subscribe(res => {
            const titleMap = new Map(res.results.map(item => [item.id, item.media?.metadata?.title ?? item.id]));
            this.buildInProgress(allProgress, titleMap);
            this.buildGenreChart(res.results);
            this.loading = false;
          });
        } else {
          this.buildInProgress(allProgress, new Map());
          this.loading = false;
        }
      },
      error: () => { this.loading = false; }
    });
  }

  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  formatPct(progress: number): string {
    return Math.round(progress * 100) + '%';
  }

  private buildStatCards(progress: MediaProgress[], sessions: ListeningSession[]): void {
    const finished = progress.filter(p => p.isFinished).length;
    const started = progress.filter(p => !p.isFinished && p.progress > 0).length;
    const totalListening = sessions.reduce((acc, s) => acc + (s.timeListening ?? 0), 0);
    const avgSession = sessions.length ? totalListening / sessions.length : 0;

    this.statCards = [
      { label: 'Books Finished', value: String(finished), icon: 'pi-check-circle', color: '#22c55e' },
      { label: 'In Progress', value: String(started), icon: 'pi-clock', color: '#8b5cf6' },
      { label: 'Hours Listened', value: Math.round(totalListening / 3600).toLocaleString(), icon: 'pi-headphones', color: '#06b6d4' },
      { label: 'Avg Session', value: this.formatTime(avgSession), icon: 'pi-play-circle', color: '#f59e0b' },
    ];
  }

  private buildInProgress(progress: MediaProgress[], titleMap: Map<string, string>): void {
    this.inProgress = progress
      .filter(p => !p.isFinished && p.progress > 0.01)
      .sort((a, b) => b.lastUpdate - a.lastUpdate)
      .slice(0, 8)
      .map(p => ({
        libraryItemId: p.libraryItemId,
        title: titleMap.get(p.libraryItemId) ?? 'Unknown',
        progress: p.progress,
        timeLeft: (p.duration ?? 0) * (1 - p.progress)
      }));
  }

  private buildListeningTimeChart(sessions: ListeningSession[]): void {
    const now = new Date();
    const months: { label: string; seconds: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const startSec = start.getTime() / 1000;
      const endSec = end.getTime() / 1000;
      const label = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const seconds = sessions
        .filter(s => (s.updatedAt ?? s.startedAt) >= startSec && (s.updatedAt ?? s.startedAt) < endSec)
        .reduce((acc, s) => acc + (s.timeListening ?? 0), 0);
      months.push({ label, seconds });
    }

    this.listeningTimeChart = {
      ...this.chartDefaults,
      grid: { left: 16, right: 16, bottom: 24, top: 16, containLabel: true },
      xAxis: {
        type: 'category',
        data: months.map(m => m.label),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11, rotate: 30 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: (v: number) => Math.round(v / 3600) + 'h', color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { show: false }
      },
      series: [{
        type: 'bar',
        data: months.map(m => m.seconds),
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#a78bfa' },
              { offset: 1, color: '#6d28d9' }
            ]
          },
          borderRadius: [6, 6, 0, 0]
        },
        barMaxWidth: 40
      }]
    };
  }

  private buildGenreChart(items: import('../../core/models/abs.models').LibraryItem[]): void {
    const genreCount: Record<string, number> = {};
    items.forEach(item => {
      item.media?.metadata?.genres?.forEach(g => {
        genreCount[g] = (genreCount[g] ?? 0) + 1;
      });
    });

    const data = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    const colors = ['#8b5cf6','#06b6d4','#22c55e','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6','#f97316','#84cc16'];

    this.genreChart = {
      ...this.chartDefaults,
      color: colors,
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data,
        label: { color: '#94a3b8', fontSize: 11 },
        itemStyle: { borderRadius: 4, borderColor: '#12121a', borderWidth: 2 },
        emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(139, 92, 246, 0.4)' } }
      }]
    };
  }

  private buildBooksCompletedChart(progress: MediaProgress[]): void {
    const monthCount: Record<string, number> = {};
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthCount[key] = 0;
    }

    progress.filter(p => p.isFinished).forEach(p => {
      // Use finishedAt if available, fall back to lastUpdate
      const ts = (p.finishedAt ?? p.lastUpdate ?? 0) * 1000;
      const d = new Date(ts);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (key in monthCount) monthCount[key]++;
    });

    this.booksCompletedChart = {
      ...this.chartDefaults,
      grid: { left: 16, right: 16, bottom: 24, top: 16, containLabel: true },
      xAxis: {
        type: 'category',
        data: Object.keys(monthCount),
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
        axisLine: { show: false }
      },
      series: [{
        type: 'bar',
        data: Object.values(monthCount),
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#22d3ee' }, { offset: 1, color: '#0891b2' }]
          },
          borderRadius: [6, 6, 0, 0]
        },
        barMaxWidth: 28
      }]
    };
  }
}
