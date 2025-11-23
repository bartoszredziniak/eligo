import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eligo-ui-layout',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full w-full overflow-hidden bg-gray-50 text-gray-900">
      <!-- Header Slot -->
      <div class="flex-none z-50">
        <ng-content select="[header]" />
      </div>

      <!-- Main Workspace (3 Columns) -->
      <div class="flex flex-1 overflow-hidden relative">
        
        <!-- Col 1: Left Sidebar Slot -->
        <div class="flex-none w-64 border-r border-gray-200 bg-white z-40">
          <ng-content select="[sidebarLeft]" />
        </div>

        <!-- Col 2: Right Sidebar Slot -->
        <div class="flex-none w-72 border-r border-gray-200 bg-white z-30">
          <ng-content select="[sidebarRight]" />
        </div>

        <!-- Col 3: Main Content Slot -->
        <main class="flex-1 relative overflow-hidden bg-gray-100">
          <ng-content />
        </main>

      </div>

      <!-- Footer Slot -->
      <div class="flex-none z-50">
        <ng-content select="[footer]" />
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiLayout {}
