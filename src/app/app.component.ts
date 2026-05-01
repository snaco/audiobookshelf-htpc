import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
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
    <div class="app-shell" [class.login-layout]="isLoginRoute">
      @if (!isLoginRoute) {
        <app-nav />
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

    .main-content {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  isLoginRoute = false;

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
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(e => {
      const url = (e as NavigationEnd).urlAfterRedirects;
      this.isLoginRoute = url.startsWith('/login');
    });
  }

  ngOnInit(): void {
    this.gamepadService.start();
    this.gamepadSub = this.gamepadService.actions$.subscribe(({ action }) => {
      if (action === 'back') this.goBack();
    });
  }

  ngOnDestroy(): void {
    this.gamepadSub?.unsubscribe();
  }

  private goBack(): void {
    if (this.playerService.sidebarMode() !== 'none') {
      this.playerService.closeSidebar();
      return;
    }
    this.location.back();
  }
}
