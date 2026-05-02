import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavComponent } from './shared/components/nav/nav.component';
import { GamepadService } from './core/services/gamepad.service';
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
export class AppComponent implements OnInit {
  isLoginRoute = false;

  constructor(
    private router: Router,
    private gamepadService: GamepadService
  ) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.isLoginRoute = (e as NavigationEnd).urlAfterRedirects.startsWith('/login');
    });
  }

  ngOnInit(): void {
    this.gamepadService.start();
  }
}
