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

const ACTIONS: GamepadAction[] = ['up', 'down', 'left', 'right', 'select', 'back', 'menu'];

@Injectable({ providedIn: 'root' })
export class GamepadService implements OnDestroy {
  private rafId: number | null = null;

  /**
   * Last-frame state per ACTION (not per button or per gamepad). On Linux,
   * `navigator.getGamepads()` typically exposes the same physical controller
   * across multiple slots (real device + virtual XInput slot from Steam,
   * Bluetooth duplicates, etc.). If we kept state per gamepad+button the
   * shared physical button state would race between slots and produce
   * spurious "press" edges every frame, manifesting as one press → many
   * focus moves. By collapsing to a single per-action state we get
   * one physical press = exactly one event regardless of slot count.
   */
  private actionStates = new Map<GamepadAction, boolean>();

  private _actions$ = new Subject<GamepadEvent>();
  readonly actions$ = this._actions$.asObservable();

  constructor(private focusService: FocusService) {}

  start(): void {
    this.poll();
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  private poll(): void {
    const gamepads = (navigator.getGamepads?.() ?? []).filter((g): g is Gamepad => !!g);

    // OR-aggregate every action's "is the user pressing it right now?"
    // across every connected gamepad slot, then edge-trigger.
    const now: Record<GamepadAction, boolean> = {
      up: false, down: false, left: false, right: false,
      select: false, back: false, menu: false,
    };

    for (const gp of gamepads) {
      const ax0 = gp.axes[0] ?? 0;
      const ax1 = gp.axes[1] ?? 0;
      if (gp.buttons[DPAD_UP]?.pressed    || ax1 < -AXIS_THRESHOLD) now.up = true;
      if (gp.buttons[DPAD_DOWN]?.pressed  || ax1 >  AXIS_THRESHOLD) now.down = true;
      if (gp.buttons[DPAD_LEFT]?.pressed  || ax0 < -AXIS_THRESHOLD) now.left = true;
      if (gp.buttons[DPAD_RIGHT]?.pressed || ax0 >  AXIS_THRESHOLD) now.right = true;
      if (gp.buttons[BTN_A]?.pressed)     now.select = true;
      if (gp.buttons[BTN_B]?.pressed)     now.back = true;
      if (gp.buttons[BTN_START]?.pressed) now.menu = true;
    }

    for (const action of ACTIONS) {
      const wasActive = this.actionStates.get(action) ?? false;
      if (now[action] && !wasActive) this.emit(action);
      this.actionStates.set(action, now[action]);
    }

    this.rafId = requestAnimationFrame(() => this.poll());
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
