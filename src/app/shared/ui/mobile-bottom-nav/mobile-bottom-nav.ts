import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type MobileTab = 'canvas' | 'elements';

@Component({
  selector: 'eligo-mobile-bottom-nav',
  imports: [CommonModule],
  template: `
    <nav class="bg-white border-t border-gray-200 md:hidden z-50 safe-area-bottom">
      <div class="flex justify-around items-center h-14">
        <button
          (click)="tabChange.emit('canvas')"
          class="flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-[80px]"
          [class]="activeTab() === 'canvas' ? 'text-primary-600' : 'text-gray-500'"
        >
          <i class="pi pi-box text-xl mb-0.5"></i>
          <span class="text-xs font-medium">Widok 3D</span>
        </button>
        
        <button
          (click)="tabChange.emit('elements')"
          class="flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-[80px]"
          [class]="activeTab() === 'elements' ? 'text-primary-600' : 'text-gray-500'"
        >
          <i class="pi pi-list text-xl mb-0.5"></i>
          <span class="text-xs font-medium">Elementy</span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
    .text-primary-600 {
      color: var(--primary-600, #2563eb);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileBottomNav {
  activeTab = input.required<MobileTab>();
  tabChange = output<MobileTab>();
}
