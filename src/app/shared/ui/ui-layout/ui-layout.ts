import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MobileTab = 'canvas' | 'elements';

@Component({
  selector: 'eligo-ui-layout',
  imports: [CommonModule],
  template: `
    <div class="flex flex-col h-full w-full overflow-hidden bg-gray-50 text-gray-900">
      <!-- Header Slot -->
      <div class="flex-none z-50">
        <ng-content select="[header]" />
      </div>

      <!-- Main Workspace -->
      <div class="flex flex-1 overflow-hidden relative">
        <!-- Col 1: Left Sidebar (Desktop: always visible, Mobile: only on 'elements' tab) -->
        <div 
          class="flex-none border-r border-gray-200 bg-white z-40 overflow-y-auto"
          [class]="leftSidebarClasses()"
        >
          <ng-content select="[sidebarLeft]" />
        </div>

        <!-- Col 2: Right Sidebar (Desktop only, hidden on mobile) -->
        <div 
          class="flex-none border-r border-gray-200 bg-white z-30 overflow-y-auto hidden md:block md:w-72"
        >
          <ng-content select="[sidebarRight]" />
        </div>

        <!-- Col 3: Main Content / Canvas -->
        <main 
          class="flex-1 relative overflow-hidden bg-gray-100"
          [class]="canvasClasses()"
        >
          <ng-content />
          
          <!-- FAB/SpeedDial Slot (Mobile only, on canvas tab) -->
          @if (activeTab() === 'canvas') {
            <div class="absolute bottom-20 right-4 md:hidden z-30">
              <ng-content select="[fab]" />
            </div>
          }
        </main>
      </div>

      <!-- Desktop Footer -->
      <div class="flex-none z-50 hidden md:block">
        <ng-content select="[footer]" />
      </div>
      
      <!-- Mobile Footer (only on canvas tab) -->
      @if (activeTab() === 'canvas') {
        <div class="flex-none z-50 md:hidden">
          <ng-content select="[mobileFooter]" />
        </div>
      }
      
      <!-- Bottom Navigation Slot -->
      <ng-content select="[bottomNav]" />
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiLayout {
  activeTab = input<MobileTab>('canvas');

  leftSidebarClasses = computed(() => {
    const isElementsTab = this.activeTab() === 'elements';
    return {
      // Mobile: full width when visible, hidden otherwise
      'w-full': isElementsTab,
      'hidden': !isElementsTab,
      // Desktop: always visible with fixed width
      'md:block': true,
      'md:w-64': true,
    };
  });

  canvasClasses = computed(() => {
    const isCanvasTab = this.activeTab() === 'canvas';
    return {
      // Mobile: hidden unless canvas tab
      'hidden': !isCanvasTab,
      // Desktop: always visible
      'md:block': true,
    };
  });
}
