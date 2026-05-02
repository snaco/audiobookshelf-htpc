import { Injectable } from '@angular/core';
import { ElementRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FocusService {
  private focusables = new Set<ElementRef>();

  register(el: ElementRef): void {
    this.focusables.add(el);
  }

  unregister(el: ElementRef): void {
    this.focusables.delete(el);
  }

  moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void {
    const current = document.activeElement;
    if (!current || current === document.body) {
      this.focusFirst();
      return;
    }

    const currentRect = current.getBoundingClientRect();
    const candidates = Array.from(this.focusables)
      .map(ref => ({ el: ref.nativeElement as HTMLElement, rect: ref.nativeElement.getBoundingClientRect() as DOMRect }))
      .filter(({ el, rect }) =>
        el !== current &&
        rect.width > 0 &&
        rect.height > 0 &&
        this.isInDirection(currentRect, rect, direction)
      );

    const best = this.findNearest(currentRect, candidates, direction);
    if (best) {
      best.el.focus({ preventScroll: true });
      best.el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }

  activate(): void {
    const current = document.activeElement as HTMLElement;
    if (current && current !== document.body) {
      current.click();
    }
  }

  focusFirst(): void {
    const first = Array.from(this.focusables).find(ref => {
      const rect = ref.nativeElement.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    first?.nativeElement.focus();
  }

  private isInDirection(current: DOMRect, candidate: DOMRect, direction: string): boolean {
    const cx = current.left + current.width / 2;
    const cy = current.top + current.height / 2;
    const rx = candidate.left + candidate.width / 2;
    const ry = candidate.top + candidate.height / 2;
    const threshold = 10;

    switch (direction) {
      case 'up': return ry < cy - threshold;
      case 'down': return ry > cy + threshold;
      case 'left': return rx < cx - threshold;
      case 'right': return rx > cx + threshold;
      default: return false;
    }
  }

  private findNearest(
    current: DOMRect,
    candidates: { el: HTMLElement; rect: DOMRect }[],
    direction: string
  ): { el: HTMLElement; rect: DOMRect } | null {
    if (!candidates.length) return null;

    const cx = current.left + current.width / 2;
    const cy = current.top + current.height / 2;

    let best: { el: HTMLElement; rect: DOMRect; score: number } | null = null;

    for (const candidate of candidates) {
      const rx = candidate.rect.left + candidate.rect.width / 2;
      const ry = candidate.rect.top + candidate.rect.height / 2;
      const dx = Math.abs(rx - cx);
      const dy = Math.abs(ry - cy);

      // Primary axis distance + weighted secondary axis penalty
      const score = direction === 'up' || direction === 'down'
        ? dy + dx * 0.5
        : dx + dy * 0.5;

      if (!best || score < best.score) {
        best = { ...candidate, score };
      }
    }

    return best;
  }
}
