import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eligo-ui-sidebar',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full w-full bg-white">
      <!-- Optional Header Slot -->
      <div class="flex-none">
        <ng-content select="[header]" />
      </div>

      <!-- Main Content Slot (Scrollable) -->
      <div class="flex-1 overflow-y-auto">
        <ng-content />
      </div>
      
      <!-- Optional Footer Slot -->
      <div class="flex-none">
        <ng-content select="[footer]" />
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiSidebar {}
