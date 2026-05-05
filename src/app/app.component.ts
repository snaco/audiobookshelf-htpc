import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterOutlet, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavComponent } from './shared/components/nav/nav.component';
import { GamepadService } from './core/services/gamepad.service';
import { FocusService } from './core/services/focus.service';
import { PlayerService } from './core/services/player.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavComponent, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast position="top-right" />
    @if (showExitConfirm) {
      <div class="exit-overlay" (click)="cancelExit()">
        <div class="exit-dialog" (click)="$event.stopPropagation()">
          <i class="pi pi-power-off exit-icon"></i>
          <h2 class="exit-title">Close Audiobookshelf?</h2>
          <p class="exit-message">There's nowhere to go back to. Close the app?</p>
          <div class="exit-actions">
            <button class="exit-btn cancel" #exitCancel (click)="cancelExit()" (keydown.enter)="cancelExit()">Cancel</button>
            <button class="exit-btn confirm" (click)="closeApp()" (keydown.enter)="closeApp()">Close</button>
          </div>
        </div>
      </div>
    }
    <div class="app-shell" [class.login-layout]="isLoginRoute">
      @if (!isLoginRoute) {
        <div class="nav-slot">
          <app-nav />
        </div>
      }
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-primary);
    }

    .login-layout {
      display: block;
    }

    .nav-slot {
      width: var(--nav-width);
      flex-shrink: 0;
      position: relative;
      height: 100%;
    }

    .main-content {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .exit-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .exit-dialog {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px 36px;
      max-width: 460px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.8);
      text-align: center;
    }

    .exit-icon {
      font-size: 36px;
      color: var(--accent-bright);
      display: block;
      margin-bottom: 12px;
    }

    .exit-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .exit-message {
      color: var(--text-secondary);
      margin-bottom: 24px;
    }

    .exit-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .exit-btn {
      min-width: 120px;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: background 0.15s, transform 0.15s;
    }

    .exit-btn.cancel {
      background: transparent;
      color: var(--text-secondary);
    }

    .exit-btn.confirm {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .exit-btn:focus-visible,
    .exit-btn:hover {
      outline: 2px solid rgba(255, 255, 255, 0.5);
      outline-offset: 2px;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  isLoginRoute = false;
  showExitConfirm = false;

  @ViewChild('exitCancel') exitCancelBtn?: ElementRef<HTMLButtonElement>;

  // Tracks SPA back-stack depth so we can prompt before leaving the app rather
  // than silently no-oping (or backing past the SPA into the host browser).
  // Incremented on push navigations, decremented on popstate (back/forward).
  private navStackDepth = 0;
  private gamepadSub?: Subscription;

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const tag = (event.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement).isContentEditable) return;

    // One move per physical press — drop OS-level auto-repeat. Steam Input
    // in a SteamOS/Bazzite gamescope session remaps the dpad to arrow keys
    // *with* key repeat, which would otherwise race the focus cursor.
    if (event.repeat) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Escape' || event.key === 'Backspace') {
      event.preventDefault();
      this.goBack();
      return;
    }

    const dir: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right'
    };
    if (dir[event.key]) {
      event.preventDefault();
      this.focusService.moveFocus(dir[event.key]);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.focusService.activate();
    }
  }

  constructor(
    private router: Router,
    private location: Location,
    private gamepadService: GamepadService,
    private focusService: FocusService,
    private playerService: PlayerService
  ) {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        if (e.restoredState != null) {
          if (this.navStackDepth > 0) this.navStackDepth--;
        } else {
          this.navStackDepth++;
        }
      } else if (e instanceof NavigationEnd) {
        this.isLoginRoute = e.urlAfterRedirects.startsWith('/login');
      }
    });
  }

  ngOnInit(): void {
    this.gamepadService.start();
    this.gamepadSub = this.gamepadService.actions$.subscribe(({ action }) => {
      if (action === 'back') this.goBack();
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.gamepadSub?.unsubscribe();
  }

  cancelExit(): void {
    this.showExitConfirm = false;
  }

  closeApp(): void {
    this.showExitConfirm = false;
    const electron = (window as unknown as { electronAPI?: { close?: () => void } }).electronAPI;
    if (electron?.close) {
      electron.close();
      return;
    }
    window.close();
  }

  private goBack(): void {
    if (this.showExitConfirm) {
      this.cancelExit();
      return;
    }
    if (this.playerService.sidebarMode() !== 'none') {
      this.playerService.closeSidebar();
      return;
    }
    if (this.navStackDepth > 1) {
      this.location.back();
      return;
    }
    this.confirmExit();
  }

  private confirmExit(): void {
    this.showExitConfirm = true;
    setTimeout(() => this.exitCancelBtn?.nativeElement.focus(), 0);
  }
}
