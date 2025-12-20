import { Component, ChangeDetectionStrategy, output, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ScrollableContainerComponent } from '../../../../shared/components/scrollable-container/scrollable-container.component';

@Component({
  selector: 'eligo-canvas-action-bar',
  imports: [ButtonModule, ScrollableContainerComponent],
  template: `
    <div class="flex flex-col items-center gap-3">
      @if (hasSelection()) {
        @if (dimensions(); as dims) {
          <!-- Floating Dimensions Pill -->
          <div class="flex items-center gap-3 px-4 py-2 bg-surface-0/90 backdrop-blur-sm rounded-full shadow-lg border border-surface-200 text-xs font-semibold animate-fadein">
            <div class="flex items-center gap-1.5" title="Szerokość">
              <i class="pi pi-arrows-h text-[10px] text-surface-500"></i>
              <span class="text-surface-900">{{ dims.width }}</span>
            </div>
            <div class="w-px h-3 bg-surface-200"></div>
            <div class="flex items-center gap-1.5" title="Głębokość">
              <i class="pi pi-arrows-v text-[10px] text-surface-500"></i>
              <span class="text-surface-900">{{ dims.depth }}</span>
            </div>
            <div class="w-px h-3 bg-surface-200"></div>
            <div class="flex items-center gap-1.5" title="Wysokość">
              <i class="pi pi-arrow-up text-[10px] text-surface-500"></i>
              <span class="text-surface-900">{{ dims.height }}</span>
            </div>
            <span class="text-[9px] uppercase tracking-wider text-surface-400 font-bold ml-1">mm</span>
          </div>
        }

        <!-- Action Bar -->
        <div class="rounded-full bg-surface-0/90 backdrop-blur-sm shadow-xl border border-surface-200 overflow-hidden min-w-fit">
          <eligo-scrollable-container>
            <div class="flex items-center gap-2 p-2">
              <!-- Selected Box Actions -->
              <p-button
                label="Kolor"
                icon="pi pi-palette"
                [rounded]="true"
                [text]="true"
                size="small"
                severity="secondary"
                (onClick)="colorClicked.emit()"
              />
              <p-button
                label="Ustawienia"
                icon="pi pi-cog"
                [rounded]="true"
                [text]="true"
                size="small"
                severity="secondary"
                (onClick)="settingsClicked.emit()"
              />

              <div class="w-px h-6 bg-surface-200 mx-1 shrink-0"></div>

              <p-button
                label="Duplikuj"
                icon="pi pi-copy"
                [rounded]="true"
                [text]="true"
                size="small"
                severity="secondary"
                (onClick)="duplicateClicked.emit()"
              />
              <p-button
                label="Obróć"
                icon="pi pi-refresh"
                [rounded]="true"
                [text]="true"
                size="small"
                severity="secondary"
                (onClick)="rotateClicked.emit()"
              />

              <div class="w-px h-6 bg-surface-200 mx-1 shrink-0"></div>

              <p-button
                label="Usuń"
                icon="pi pi-trash"
                [rounded]="true"
                [text]="true"
                size="small"
                severity="danger"
                styleClass="!text-red-500 hover:!bg-red-50"
                (onClick)="removeClicked.emit()"
              />
            </div>
          </eligo-scrollable-container>
        </div>
      } @else {
        <!-- No Selection Actions -->
        <div class="rounded-full bg-surface-0/90 backdrop-blur-sm shadow-xl border border-surface-200 overflow-hidden min-w-fit">
          <eligo-scrollable-container>
            <div class="flex items-center gap-2 p-2">
              <p-button
                label="Wymiary szuflady"
                icon="pi pi-sliders-h"
                [rounded]="true"
                [text]="true"
                size="small"
                severity="secondary"
                styleClass="whitespace-nowrap"
                (onClick)="drawerSettingsClicked.emit()"
              />
            </div>
          </eligo-scrollable-container>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasActionBar {
  hasSelection = input<boolean>(false);
  dimensions = input<{ width: number; depth: number; height: number } | null>(null);

  colorClicked = output<void>();
  settingsClicked = output<void>();
  duplicateClicked = output<void>();
  rotateClicked = output<void>();
  removeClicked = output<void>();
  drawerSettingsClicked = output<void>();
}
