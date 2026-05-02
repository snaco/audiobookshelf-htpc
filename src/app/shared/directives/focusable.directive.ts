import { Directive, ElementRef, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { FocusService } from '../../core/services/focus.service';

@Directive({
  selector: '[appFocusable]',
  standalone: true
})
export class FocusableDirective implements OnInit, OnDestroy {
  @HostBinding('attr.tabindex') tabindex = '0';

  constructor(private el: ElementRef, private focusService: FocusService) {}

  ngOnInit(): void {
    this.focusService.register(this.el);
  }

  ngOnDestroy(): void {
    this.focusService.unregister(this.el);
  }
}
