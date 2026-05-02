import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FocusableDirective } from '../../directives/focusable.directive';
import { TooltipModule } from 'primeng/tooltip';

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
        </div>
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
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .side-nav {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: var(--nav-width);
      height: 100%;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      padding: 12px 0;
      flex-shrink: 0;
    }

    .nav-top {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .nav-bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .nav-logo {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      color: var(--accent);

      i {
        font-size: 28px;
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s, background 0.2s;
      cursor: pointer;
      border: none;
      background: transparent;

      i {
        font-size: 20px;
      }

      &:hover, &:focus-visible {
        color: var(--text-primary);
        background: var(--bg-hover);
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      &.active {
        color: var(--accent);
        background: rgba(139, 92, 246, 0.15);
      }
    }
  `]
})
export class NavComponent {
  navItems: NavItem[] = [
    { icon: 'pi-home', label: 'Home', route: '/home' },
    { icon: 'pi-book', label: 'Library', route: '/library' },
    { icon: 'pi-th-large', label: 'Series', route: '/series' },
    { icon: 'pi-chart-bar', label: 'Stats', route: '/stats' },
  ];
}
