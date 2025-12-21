import { Component, ChangeDetectionStrategy, output, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ScrollableContainerComponent } from '../../../../shared/components/scrollable-container/scrollable-container.component';

@Component({
  selector: 'eligo-canvas-action-bar',
  imports: [ButtonModule, ScrollableContainerComponent],
  template: `
    <div class="flex flex-col items-center gap-2 w-full">
      @if (hasSelection()) {
        <!-- Action Bar -->
        <div class="rounded-full bg-surface-0/90 backdrop-blur-sm shadow-xl border border-surface-200 overflow-hidden max-w-full">
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
        <div class="rounded-full bg-surface-0/90 backdrop-blur-sm shadow-xl border border-surface-200 overflow-hidden max-w-full">
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

  colorClicked = output<void>();
  settingsClicked = output<void>();
  duplicateClicked = output<void>();
  rotateClicked = output<void>();
  removeClicked = output<void>();
  drawerSettingsClicked = output<void>();
}
