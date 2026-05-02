import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
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
    PasswordModule,
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

          <div class="field">
            <label for="password">Password</label>
            <p-password
              id="password"
              [(ngModel)]="password"
              name="password"
              [feedback]="false"
              [toggleMask]="true"
              placeholder="password"
              styleClass="w-full"
              inputStyleClass="w-full"
              appFocusable
            />
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

          <p-button
            type="submit"
            label="Connect"
            [loading]="loading"
            styleClass="w-full p-button-lg"
            appFocusable
          />
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

    :host ::ng-deep .p-password {
      width: 100%;
    }
  `]
})
export class LoginComponent {
  serverUrl = localStorage.getItem('abs_server_url') ?? '';
  username = '';
  password = '';
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
        this.router.navigate(['/home']).then(navigated => {
          // Navigation can silently fail (e.g. guard redirect) — reset state if we're still here
          if (!navigated) {
            this.loading = false;
            this.error = 'Login succeeded but navigation failed. Please try again.';
          }
        });
      },
      error: err => {
        this.loading = false;
        this.error = err.status === 401
          ? 'Invalid username or password'
          : err.message?.includes('No token')
            ? 'Server response was missing an auth token. Check the server URL.'
            : 'Could not connect to server. Check the URL and try again.';
      }
    });
  }
}
