import { Component, Input, ContentChild, TemplateRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scrollable-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="scrollable-row">
      @if (title) {
        <h2 class="row-title">{{ title }}</h2>
      }
      <div class="row-track" #track>
        <ng-content />
      </div>
    </section>
  `,
  styles: [`
    .scrollable-row {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .row-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.01em;
      padding: 0 4px;
    }

    .row-track {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      overflow-y: visible;
      padding: 8px 8px 16px;
      scroll-snap-type: x proximity;
      scroll-behavior: smooth;
      -ms-overflow-style: none;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      ::ng-deep > * {
        scroll-snap-align: start;
      }
    }
  `]
})
export class ScrollableRowComponent {
  @Input() title = '';
  @ViewChild('track') track!: ElementRef<HTMLDivElement>;
}
