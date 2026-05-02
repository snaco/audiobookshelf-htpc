import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { FocusService } from './focus.service';

export type GamepadAction = 'up' | 'down' | 'left' | 'right' | 'select' | 'back' | 'menu';

export interface GamepadEvent {
  action: GamepadAction;
}

const BTN_A = 0;
const BTN_B = 1;
const BTN_START = 9;
const DPAD_UP = 12;
const DPAD_DOWN = 13;
const DPAD_LEFT = 14;
const DPAD_RIGHT = 15;

const AXIS_THRESHOLD = 0.5;
const REPEAT_DELAY_MS = 380;
const REPEAT_RATE_MS = 130;

@Injectable({ providedIn: 'root' })
export class GamepadService implements OnDestroy {
  private rafId: number | null = null;
  private buttonStates = new Map<string, boolean>();
  private repeatTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private _actions$ = new Subject<GamepadEvent>();
  readonly actions$ = this._actions$.asObservable();

  constructor(private focusService: FocusService) {}

  start(): void {
    this.poll();
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.repeatTimers.forEach(t => clearTimeout(t));
  }

  private poll(): void {
    const gamepads = navigator.getGamepads?.() ?? [];
    for (const gp of gamepads) {
      if (gp) this.processGamepad(gp);
    }
    this.rafId = requestAnimationFrame(() => this.poll());
  }

  private processGamepad(gp: Gamepad): void {
    const checks: { key: string; action: GamepadAction; active: boolean }[] = [
      { key: 'dpad_up',    action: 'up',     active: !!gp.buttons[DPAD_UP]?.pressed },
      { key: 'dpad_down',  action: 'down',   active: !!gp.buttons[DPAD_DOWN]?.pressed },
      { key: 'dpad_left',  action: 'left',   active: !!gp.buttons[DPAD_LEFT]?.pressed },
      { key: 'dpad_right', action: 'right',  active: !!gp.buttons[DPAD_RIGHT]?.pressed },
      { key: 'axis_up',    action: 'up',     active: (gp.axes[1] ?? 0) < -AXIS_THRESHOLD },
      { key: 'axis_down',  action: 'down',   active: (gp.axes[1] ?? 0) > AXIS_THRESHOLD },
      { key: 'axis_left',  action: 'left',   active: (gp.axes[0] ?? 0) < -AXIS_THRESHOLD },
      { key: 'axis_right', action: 'right',  active: (gp.axes[0] ?? 0) > AXIS_THRESHOLD },
      { key: 'btn_a',      action: 'select', active: !!gp.buttons[BTN_A]?.pressed },
      { key: 'btn_b',      action: 'back',   active: !!gp.buttons[BTN_B]?.pressed },
      { key: 'btn_start',  action: 'menu',   active: !!gp.buttons[BTN_START]?.pressed },
    ];

    for (const { key, action, active } of checks) {
      const wasActive = this.buttonStates.get(key) ?? false;

      if (active && !wasActive) {
        this.emit(action);
        // Start hold-repeat for directional actions
        if (action === 'up' || action === 'down' || action === 'left' || action === 'right') {
          const initial = setTimeout(() => {
            const interval = setInterval(() => this.emit(action), REPEAT_RATE_MS) as unknown as ReturnType<typeof setTimeout>;
            this.repeatTimers.set(key + '_interval', interval);
          }, REPEAT_DELAY_MS);
          this.repeatTimers.set(key, initial);
        }
      } else if (!active && wasActive) {
        clearTimeout(this.repeatTimers.get(key));
        clearInterval(this.repeatTimers.get(key + '_interval') as unknown as ReturnType<typeof setInterval>);
        this.repeatTimers.delete(key);
        this.repeatTimers.delete(key + '_interval');
      }

      this.buttonStates.set(key, active);
    }
  }

  private emit(action: GamepadAction): void {
    this._actions$.next({ action });

    if (action === 'up' || action === 'down' || action === 'left' || action === 'right') {
      this.focusService.moveFocus(action);
    } else if (action === 'select') {
      this.focusService.activate();
    }
  }
}
