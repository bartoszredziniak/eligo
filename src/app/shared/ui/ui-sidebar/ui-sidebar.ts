import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eligo-ui-sidebar',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full  w-full bg-white">
      <div class="flex-none">
        <ng-content select="[header]" />
      </div>

      <div class="flex-1 overflow-y-auto py-4 px-4">
        <ng-content />
      </div>

      <div class="flex-none">
        <ng-content select="[footer]" />
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSidebar {}
