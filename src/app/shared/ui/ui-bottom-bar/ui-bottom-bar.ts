import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eligo-ui-bottom-bar',
  imports: [CommonModule],
  template: `
    <div class="bg-white border-t border-gray-200 p-4 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <ng-content />
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiBottomBar {}
