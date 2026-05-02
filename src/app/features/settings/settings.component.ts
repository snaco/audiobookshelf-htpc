import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';
import { FocusableDirective } from '../../shared/directives/focusable.directive';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ButtonModule, FocusableDirective],
  template: `
    <div class="settings-page">
      <header class="page-header">
        <h1 class="page-title">Settings</h1>
      </header>

      <div class="settings-sections" data-focus-zone="grid">
        <section class="settings-section">
          <h2 class="section-title">Account</h2>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Logged in as</span>
              <span class="setting-value">{{ username }}</span>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Server</span>
              <span class="setting-value server-url">{{ serverUrl }}</span>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Sign out of your account</span>
            </div>
            <p-button
              label="Log Out"
              severity="danger"
              [outlined]="true"
              icon="pi pi-sign-out"
              (onClick)="logout()"
              appFocusable
            />
          </div>
        </section>

        <section class="settings-section">
          <h2 class="section-title">About</h2>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Audiobookshelf HTPC</span>
              <span class="setting-value text-muted">Version 1.0.0</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      height: 100%;
      overflow-y: auto;
      padding: 40px 48px;
      max-width: 720px;
    }

    .page-header {
      margin-bottom: 40px;
    }

    .page-title {
      font-size: 32px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .settings-sections {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .settings-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
    }

    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      padding: 16px 20px 12px;
      border-bottom: 1px solid var(--border);
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);

      &:last-child {
        border-bottom: none;
      }
    }

    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .setting-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .setting-value {
      font-size: 13px;
      color: var(--text-secondary);

      &.server-url {
        font-family: monospace;
        font-size: 12px;
        color: var(--text-muted);
      }
    }
  `]
})
export class SettingsComponent {
  get username(): string { return this.auth.user()?.username ?? ''; }
  get serverUrl(): string { return this.auth.serverUrl(); }

  constructor(private auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
