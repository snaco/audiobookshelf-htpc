import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../core/services/auth.service';
import { FocusableDirective } from '../../shared/directives/focusable.directive';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    MessageModule,
    FocusableDirective
  ],
  template: `
    <div class="login-page">
      <div class="login-backdrop"></div>

      <div class="login-card">
        <div class="login-header">
          <div class="app-icon">
            <i class="pi pi-headphones"></i>
          </div>
          <h1>Audiobookshelf</h1>
          <p class="subtitle">Connect to your server</p>
        </div>

        <form class="login-form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="serverUrl">Server URL</label>
            <input
              id="serverUrl"
              pInputText
              type="url"
              [(ngModel)]="serverUrl"
              name="serverUrl"
              placeholder="https://abs.example.com"
              autocomplete="url"
              appFocusable
              required
              (ngModelChange)="onUrlChange()"
            />
          </div>

          <div class="field">
            <label for="username">Username</label>
            <input
              id="username"
              pInputText
              type="text"
              [(ngModel)]="username"
              name="username"
              placeholder="username"
              autocomplete="username"
              appFocusable
              required
            />
          </div>

          <div class="field password-field">
            <label for="password">Password</label>
            <input
              id="password"
              pInputText
              [type]="showPassword ? 'text' : 'password'"
              [(ngModel)]="password"
              name="password"
              placeholder="password"
              autocomplete="current-password"
              appFocusable
              required
            />
            <button
              type="button"
              class="reveal-toggle"
              [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
              (click)="showPassword = !showPassword"
              tabindex="-1"
            >
              <i [class]="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>

          @if (insecureWarning) {
            <p-message
              severity="warn"
              styleClass="w-full"
              text="Your server is using HTTP. Credentials will be sent unencrypted. Use HTTPS for security."
            />
          }

          @if (error) {
            <p-message severity="error" [text]="error" styleClass="w-full" />
          }

          <button
            type="submit"
            pButton
            class="w-full p-button-lg connect-btn"
            [disabled]="loading"
            appFocusable
          >
            @if (loading) {
              <i class="pi pi-spin pi-spinner" style="margin-right: 8px"></i>
            }
            <span>Connect</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      position: relative;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
      overflow: hidden;
    }

    .login-backdrop {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 80% at 50% 0%, rgba(139, 92, 246, 0.12), transparent 70%);
      pointer-events: none;
    }

    .login-card {
      position: relative;
      width: 420px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 48px 40px;
      box-shadow: var(--shadow-card);
    }

    .login-header {
      text-align: center;
      margin-bottom: 36px;
    }

    .app-icon {
      width: 72px;
      height: 72px;
      background: rgba(139, 92, 246, 0.15);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;

      i {
        font-size: 36px;
        color: var(--accent);
      }
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 14px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-secondary);
      }

      input {
        width: 100%;
      }
    }

    .password-field {
      position: relative;

      input {
        /* Leave room for the reveal toggle */
        padding-right: 40px;
      }
    }

    .reveal-toggle {
      position: absolute;
      right: 8px;
      bottom: 6px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 6px;

      &:hover {
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.05);
      }
    }
  `]
})
export class LoginComponent {
  serverUrl = localStorage.getItem('abs_server_url') ?? '';
  username = '';
  password = '';
  showPassword = false;
  loading = false;
  error = '';
  insecureWarning = false;

  constructor(private auth: AuthService, private router: Router) {}

  onUrlChange(): void {
    this.insecureWarning = this.serverUrl.startsWith('http://');
  }

  onSubmit(): void {
    if (!this.serverUrl || !this.username || !this.password) return;

    this.loading = true;
    this.error = '';
    this.insecureWarning = this.serverUrl.startsWith('http://');

    this.auth.login(this.serverUrl, this.username, this.password).subscribe({
      next: () => {
        // loading stays true while navigating — it will be destroyed with this component
        this.router.navigate(['/home']).then(navigated => {
          if (!navigated) {
            this.loading = false;
            this.error = 'Authenticated but could not load home. Check console for details.';
          }
        }).catch(() => {
          this.loading = false;
          this.error = 'Navigation error. Please try again.';
        });
      },
      error: err => {
        this.loading = false;
        if (err.status === 401) {
          this.error = 'Invalid username or password';
        } else if (err.status === 0 || err.message?.includes('No auth token')) {
          this.error = 'Server response was missing an auth token — check the console for the response shape.';
        } else {
          this.error = `Could not connect to server (${err.status ?? 'unknown error'}). Check the URL and try again.`;
        }
      }
    });
  }
}
