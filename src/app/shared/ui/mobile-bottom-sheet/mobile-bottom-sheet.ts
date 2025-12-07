import { Component, ChangeDetectionStrategy, input, output, signal, HostListener, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SheetState = 'hidden' | 'peek' | 'expanded';

@Component({
  selector: 'eligo-mobile-bottom-sheet',
  imports: [CommonModule],
  template: `
    <!-- Sheet (no backdrop - user can still interact with app) -->
    <div 
      class="fixed bottom-14 left-0 right-0 bg-white rounded-t-2xl z-40 md:hidden shadow-2xl transition-transform duration-300 ease-out"
      [style.transform]="getTransform()"
    >
      <!-- Handle - tap to toggle -->
      <button
        class="w-full flex justify-center py-2 cursor-pointer touch-none"
        (click)="toggleExpand()"
        aria-label="Rozwiń lub zwiń panel"
      >
        <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
      </button>
      
      <!-- Header (always visible in peek mode) -->
      <div 
        class="px-3 pb-1 flex items-center justify-between cursor-pointer"
        (click)="toggleExpand()"
      >
        <h3 class="text-sm font-semibold text-gray-900">{{ title() }}</h3>
        <div class="flex items-center gap-1">
          <i 
            class="pi text-gray-400 text-xs transition-transform duration-200"
            [class.pi-chevron-up]="state() === 'peek'"
            [class.pi-chevron-down]="state() === 'expanded'"
          ></i>
        </div>
      </div>
      
      <!-- Content (visible when expanded) -->
      <div 
        class="overflow-y-auto px-2 pb-2 transition-all duration-300"
        [style.max-height.px]="state() === 'expanded' ? 350 : 0"
        [style.opacity]="state() === 'expanded' ? 1 : 0"
      >
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileBottomSheet implements OnChanges {
  visible = input.required<boolean>();
  title = input<string>('Ustawienia');
  visibleChange = output<boolean>();
  
  state = signal<SheetState>('hidden');
  
  ngOnChanges() {
    // When visible changes, update state
    if (this.visible()) {
      // Only set to peek if currently hidden
      if (this.state() === 'hidden') {
        this.state.set('peek');
      }
    } else {
      this.state.set('hidden');
    }
  }

  getTransform(): string {
    switch (this.state()) {
      case 'hidden':
        return 'translateY(100%)';
      case 'peek':
      case 'expanded':
        return 'translateY(0)';
      default:
        return 'translateY(100%)';
    }
  }

  toggleExpand() {
    if (this.state() === 'peek') {
      this.state.set('expanded');
    } else if (this.state() === 'expanded') {
      this.state.set('peek');
    } else if (this.state() === 'hidden') {
      // If somehow hidden but toggle called, go to peek
      this.state.set('peek');
    }
  }

  close(event?: Event) {
    event?.stopPropagation();
    this.state.set('hidden');
    this.visibleChange.emit(false);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.state() === 'expanded') {
      this.state.set('peek');
    }
  }
}
