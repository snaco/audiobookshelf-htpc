import { Injectable, ElementRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FocusService {
  private focusables = new Set<ElementRef>();
  private lastFocused: HTMLElement | null = null;

  register(el: ElementRef): void {
    this.focusables.add(el);
  }

  unregister(el: ElementRef): void {
    this.focusables.delete(el);
  }

  moveFocus(direction: 'up' | 'down' | 'left' | 'right'): void {
    const current = document.activeElement as HTMLElement | null;
    if (!current || current === document.body) {
      this.focusFirst();
      return;
    }

    switch (this.getZone(current)) {
      case 'grid':            return this.moveInGrid(current, direction);
      case 'nav':             return this.moveInNav(current, direction);
      case 'sidebar':         return this.moveInSidebar(current, direction);
      case 'player-controls': return this.moveInPlayerControls(current, direction);
      case 'player-actions':  return this.moveInPlayerActions(current, direction);
      default:                return this.moveGeneric(current, direction);
    }
  }

  activate(): void {
    const current = document.activeElement as HTMLElement;
    if (current && current !== document.body) current.click();
  }

  focusEl(el: HTMLElement): void {
    this.focusItem(el);
  }

  focusFirst(): void {
    const first = Array.from(this.focusables).find(ref => {
      const rect = ref.nativeElement.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (first) this.focusItem(first.nativeElement);
  }

  private getZone(el: HTMLElement): string {
    return el.closest('[data-focus-zone]')?.getAttribute('data-focus-zone') ?? '';
  }

  private moveInGrid(current: HTMLElement, direction: 'up' | 'down' | 'left' | 'right'): void {
    const items = this.getZoneItemsWithRects('grid');
    const rows = this.buildRows(items);

    let rowIdx = -1, colIdx = -1;
    for (let r = 0; r < rows.length; r++) {
      const c = rows[r].findIndex(i => i.el === current);
      if (c !== -1) { rowIdx = r; colIdx = c; break; }
    }
    if (rowIdx === -1) return;

    const row = rows[rowIdx];

    switch (direction) {
      case 'right': {
        if (colIdx < row.length - 1) {
          this.focusItem(row[colIdx + 1].el);
        } else if (rowIdx < rows.length - 1) {
          this.focusItem(rows[rowIdx + 1][0].el);
        }
        break;
      }
      case 'left': {
        if (colIdx > 0) {
          this.focusItem(row[colIdx - 1].el);
        } else {
          this.focusFirstInZone('nav');
        }
        break;
      }
      case 'up': {
        if (rowIdx > 0) {
          const prev = rows[rowIdx - 1];
          this.focusItem(prev[Math.min(colIdx, prev.length - 1)].el);
        } else {
          this.scrollContainerEdge(current, 'top');
        }
        break;
      }
      case 'down': {
        if (rowIdx < rows.length - 1) {
          const next = rows[rowIdx + 1];
          this.focusItem(next[Math.min(colIdx, next.length - 1)].el);
        } else {
          this.scrollContainerEdge(current, 'bottom');
        }
        break;
      }
    }
  }

  private moveInSidebar(current: HTMLElement, direction: 'up' | 'down' | 'left' | 'right'): void {
    if (direction === 'left') {
      // Collapse the sidebar by triggering its close button
      const closeBtn = document.querySelector('[data-sidebar-close]') as HTMLElement | null;
      closeBtn?.click();
      return;
    }
    if (direction === 'right') return;

    const items = this.getZoneItemsWithRects('sidebar').map(i => i.el);
    const idx = items.indexOf(current);
    if (idx === -1) return;
    if (direction === 'up' && idx > 0) this.focusItem(items[idx - 1]);
    if (direction === 'down' && idx < items.length - 1) this.focusItem(items[idx + 1]);
  }

  private moveInPlayerControls(current: HTMLElement, direction: 'up' | 'down' | 'left' | 'right'): void {
    // Sort strictly by horizontal position — controls are a single row but the
    // larger play button has a different `top` due to align-items: center.
    const items = this.getZoneItemsWithRects('player-controls')
      .sort((a, b) => a.rect.left - b.rect.left)
      .map(i => i.el);
    const idx = items.indexOf(current);

    if (direction === 'left') {
      if (idx > 0) {
        this.focusItem(items[idx - 1]);
      } else {
        this.focusFirstInZone('nav');
      }
      return;
    }
    if (direction === 'right') {
      if (idx !== -1 && idx < items.length - 1) {
        this.focusItem(items[idx + 1]);
      } else {
        // From the rightmost control, fall through to the top-right action buttons.
        const actions = this.getZoneItemsWithRects('player-actions')
          .sort((a, b) => a.rect.left - b.rect.left)
          .map(i => i.el);
        if (actions.length) this.focusItem(actions[0]);
      }
      return;
    }
    if (direction === 'up') {
      const actions = this.getZoneItemsWithRects('player-actions')
        .sort((a, b) => a.rect.left - b.rect.left)
        .map(i => i.el);
      if (actions.length) this.focusItem(actions[0]);
    }
  }

  private moveInPlayerActions(current: HTMLElement, direction: 'up' | 'down' | 'left' | 'right'): void {
    const items = this.getZoneItemsWithRects('player-actions')
      .sort((a, b) => a.rect.left - b.rect.left)
      .map(i => i.el);
    const idx = items.indexOf(current);

    if (direction === 'left') {
      if (idx > 0) {
        this.focusItem(items[idx - 1]);
      } else {
        // From leftmost top-right action, drop back into the player controls (rightmost).
        const controls = this.getZoneItemsWithRects('player-controls')
          .sort((a, b) => a.rect.left - b.rect.left)
          .map(i => i.el);
        if (controls.length) this.focusItem(controls[controls.length - 1]);
      }
      return;
    }
    if (direction === 'right') {
      if (idx !== -1 && idx < items.length - 1) this.focusItem(items[idx + 1]);
      return;
    }
    if (direction === 'down') {
      const controls = this.getZoneItemsWithRects('player-controls')
        .sort((a, b) => a.rect.left - b.rect.left)
        .map(i => i.el);
      if (controls.length) {
        // Land on play/pause (middle of the 5 controls)
        this.focusItem(controls[Math.floor(controls.length / 2)]);
      }
    }
    // up: no-op (already at the top)
  }

  private moveInNav(current: HTMLElement, direction: 'up' | 'down' | 'left' | 'right'): void {
    if (direction === 'right') {
      const gridItems = this.getZoneItemsWithRects('grid');
      if (gridItems.length) {
        this.focusItem(gridItems[0].el);
        return;
      }
      const playerControls = this.getZoneItemsWithRects('player-controls');
      if (playerControls.length) {
        // Focus the play/pause button (middle-ish) when entering player from nav
        this.focusItem(playerControls[Math.min(2, playerControls.length - 1)].el);
        return;
      }
      // No grid/player on this route — fall back to spatial nav into main content
      this.moveGeneric(current, 'right');
      return;
    }
    if (direction === 'left') return;

    const items = this.getZoneItemsWithRects('nav').map(i => i.el);
    const idx = items.indexOf(current);
    if (idx === -1) return;

    if (direction === 'up' && idx > 0)               this.focusItem(items[idx - 1]);
    if (direction === 'down' && idx < items.length - 1) this.focusItem(items[idx + 1]);
  }

  private focusItem(el: HTMLElement): void {
    if (this.lastFocused && this.lastFocused !== el) {
      this.lastFocused.removeAttribute('data-kf');
    }
    this.lastFocused = el;
    el.setAttribute('data-kf', '');
    el.addEventListener('blur', () => el.removeAttribute('data-kf'), { once: true });
    el.focus({ preventScroll: true });
    this.scrollToView(el);
  }

  private focusFirstInZone(zone: string): void {
    const items = this.getZoneItemsWithRects(zone);
    if (items.length) this.focusItem(items[0].el);
  }

  private getZoneItemsWithRects(zone: string): { el: HTMLElement; rect: DOMRect }[] {
    const out: { el: HTMLElement; rect: DOMRect }[] = [];
    for (const ref of this.focusables) {
      const el = ref.nativeElement as HTMLElement;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && this.getZone(el) === zone) {
        out.push({ el, rect });
      }
    }
    return out.sort((a, b) => {
      const dy = a.rect.top - b.rect.top;
      return Math.abs(dy) > 5 ? dy : a.rect.left - b.rect.left;
    });
  }

  private buildRows(items: { el: HTMLElement; rect: DOMRect }[]): { el: HTMLElement; rect: DOMRect }[][] {
    if (!items.length) return [];
    const rows: { el: HTMLElement; rect: DOMRect }[][] = [];
    let row: { el: HTMLElement; rect: DOMRect }[] = [];
    let rowTop = 0;

    for (const item of items) {
      if (row.length === 0 || Math.abs(item.rect.top - rowTop) <= 5) {
        if (row.length === 0) rowTop = item.rect.top;
        row.push(item);
      } else {
        rows.push(row);
        row = [item];
        rowTop = item.rect.top;
      }
    }
    if (row.length) rows.push(row);
    return rows;
  }

  private scrollToView(el: HTMLElement): void {
    const eRect = el.getBoundingClientRect();
    let parent = el.parentElement;
    let foundV = false, foundH = false;

    while (parent && parent !== document.body) {
      if (foundV && foundH) break;
      const style = window.getComputedStyle(parent);
      const pRect = parent.getBoundingClientRect();

      if (!foundV && (style.overflowY === 'auto' || style.overflowY === 'scroll')
          && parent.scrollHeight > parent.clientHeight + 1) {
        foundV = true;
        const target = pRect.top + pRect.height * 0.3;
        parent.scrollBy({ top: eRect.top - target, behavior: 'smooth' });
      }

      if (!foundH && (style.overflowX === 'auto' || style.overflowX === 'scroll')
          && parent.scrollWidth > parent.clientWidth + 1) {
        foundH = true;
        const center = pRect.left + pRect.width / 2 - eRect.width / 2;
        parent.scrollBy({ left: eRect.left - center, behavior: 'smooth' });
      }

      parent = parent.parentElement;
    }
  }

  private scrollContainerEdge(el: HTMLElement, edge: 'top' | 'bottom'): void {
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const oy = window.getComputedStyle(parent).overflowY;
      if (oy === 'auto' || oy === 'scroll') {
        parent.scrollTo({ top: edge === 'top' ? 0 : parent.scrollHeight, behavior: 'smooth' });
        return;
      }
      parent = parent.parentElement;
    }
  }

  private moveGeneric(current: HTMLElement, direction: 'up' | 'down' | 'left' | 'right'): void {
    const cRect = current.getBoundingClientRect();
    const candidates = Array.from(this.focusables)
      .map(ref => ({ el: ref.nativeElement as HTMLElement, rect: ref.nativeElement.getBoundingClientRect() as DOMRect }))
      .filter(({ el, rect }) =>
        el !== current && rect.width > 0 && rect.height > 0 && this.isInDir(cRect, rect, direction)
      );
    const best = this.findNearest(cRect, candidates, direction);
    if (best) this.focusItem(best.el);
  }

  private isInDir(cur: DOMRect, cand: DOMRect, dir: string): boolean {
    const cx = cur.left + cur.width / 2, cy = cur.top + cur.height / 2;
    const rx = cand.left + cand.width / 2, ry = cand.top + cand.height / 2;
    const t = 10;
    switch (dir) {
      case 'up':    return ry < cy - t;
      case 'down':  return ry > cy + t;
      case 'left':  return rx < cx - t;
      case 'right': return rx > cx + t;
      default:      return false;
    }
  }

  private findNearest(
    cur: DOMRect,
    cands: { el: HTMLElement; rect: DOMRect }[],
    dir: string
  ): { el: HTMLElement; rect: DOMRect } | null {
    if (!cands.length) return null;
    const cx = cur.left + cur.width / 2, cy = cur.top + cur.height / 2;
    return cands.reduce<{ el: HTMLElement; rect: DOMRect; score: number } | null>((best, c) => {
      const rx = c.rect.left + c.rect.width / 2, ry = c.rect.top + c.rect.height / 2;
      const dx = Math.abs(rx - cx), dy = Math.abs(ry - cy);
      const score = (dir === 'up' || dir === 'down') ? dy + dx * 0.5 : dx + dy * 0.5;
      return !best || score < best.score ? { ...c, score } : best;
    }, null);
  }
}
