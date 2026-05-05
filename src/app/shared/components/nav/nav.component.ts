import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FocusableDirective } from '../../directives/focusable.directive';
import { TooltipModule } from 'primeng/tooltip';
import { PlayerService } from '../../../core/services/player.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FocusableDirective, TooltipModule],
  template: `
    <nav class="side-nav" data-focus-zone="nav">
      <div class="nav-top">
        <div class="nav-logo">
          <i class="pi pi-headphones"></i>
          <span class="nav-label">Audiobookshelf</span>
        </div>
        @if (player.nowPlayingItemId(); as itemId) {
          <a
            [routerLink]="['/player', itemId]"
            routerLinkActive="active"
            appFocusable
            class="nav-item now-playing"
            [pTooltip]="player.nowPlayingTitle() || 'Now Playing'"
            tooltipPosition="right"
          >
            <i class="pi pi-play-circle"></i>
            <span class="nav-label">{{ player.nowPlayingTitle() || 'Now Playing' }}</span>
          </a>
        }
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            appFocusable
            class="nav-item"
            [pTooltip]="item.label"
            tooltipPosition="right"
          >
            <i [class]="'pi ' + item.icon"></i>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        }
      </div>
      <div class="nav-bottom">
        <a
          routerLink="/settings"
          routerLinkActive="active"
          appFocusable
          class="nav-item"
          pTooltip="Settings"
          tooltipPosition="right"
        >
          <i class="pi pi-cog"></i>
          <span class="nav-label">Settings</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .side-nav {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: var(--nav-width);
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      padding: 12px 0;
      overflow: hidden;
      z-index: 100;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                  box-shadow 0.25s ease;

      &:focus-within {
        width: 240px;
        box-shadow: 4px 0 32px rgba(0, 0, 0, 0.6);
      }
    }

    .nav-top {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      width: 100%;
      padding: 0 12px;
    }

    .nav-bottom {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      padding: 0 12px;
    }

    .nav-logo {
      width: 100%;
      height: 48px;
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 16px;
      padding: 0 12px;
      color: var(--accent);
      overflow: hidden;
      white-space: nowrap;

      i {
        font-size: 24px;
        flex-shrink: 0;
        width: 24px;
        text-align: center;
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      width: 100%;
      height: 48px;
      padding: 0 12px;
      gap: 14px;
      border-radius: 12px;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s, background 0.2s;
      cursor: pointer;
      border: none;
      background: transparent;
      overflow: hidden;
      white-space: nowrap;

      i {
        font-size: 20px;
        flex-shrink: 0;
        width: 24px;
        text-align: center;
      }

      &:hover, &:focus-visible {
        color: var(--text-primary);
        background: var(--bg-hover);
        outline: none;
      }

      &.active {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        color: white;
      }

      &.now-playing {
        color: var(--accent);
        margin-bottom: 8px;

        i { font-size: 26px; }
      }
    }

    .nav-label {
      opacity: 0;
      font-size: 15px;
      font-weight: 500;
      color: inherit;
      white-space: nowrap;
      overflow: hidden;
      transition: opacity 0.12s ease;

      .side-nav:focus-within & {
        opacity: 1;
        transition-delay: 0.12s;
      }
    }
  `]
})
export class NavComponent {
  readonly player = inject(PlayerService);

  navItems: NavItem[] = [
    { icon: 'pi-home', label: 'Home', route: '/home' },
    { icon: 'pi-book', label: 'Library', route: '/library' },
    { icon: 'pi-th-large', label: 'Series', route: '/series' },
    { icon: 'pi-chart-bar', label: 'Stats', route: '/stats' },
  ];
}
