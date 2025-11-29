import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { UiSidebar } from '../../../shared/ui/ui-sidebar/ui-sidebar';
import { SidebarSection } from '../../../shared/ui/sidebar-section/sidebar-section';
import { ConfiguratorStateService } from '../../services/configurator-state.service';
import { DrawerService } from '../../services/drawer.service';
import { BOX_COLORS } from '../../models/drawer.models';

import { ValidationErrorsPanel } from '../../../features/configurator/components/validation-errors-panel/validation-errors-panel';

@Component({
  selector: 'eligo-tools-sidebar',
  imports: [CommonModule, ButtonModule, UiSidebar, SidebarSection, ValidationErrorsPanel],
  template: `
    <eligo-ui-sidebar>
      <eligo-sidebar-section title="Narzędzia">
        <div class="flex flex-col gap-2">
          <p-button
            label="Dodaj Pudełko"
            icon="pi pi-plus"
            styleClass="w-full"
            (onClick)="addBox()"
          />
        </div>
      </eligo-sidebar-section>

      <eligo-sidebar-section title="Lista Elementów">
        <div class="flex flex-col gap-2">
          <!-- Drawer Item -->
          <button
            type="button"
            class="w-full p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center"
            [class.border-primary]="stateService.selectedBoxId() === null"
            [class.bg-blue-50]="stateService.selectedBoxId() === null"
            (click)="stateService.selectBox(null)"
          >
            <span class="text-sm font-medium">Szuflada</span>
            <i class="pi pi-box"></i>
          </button>

          @if (drawerService.boxes().length === 0) {
            <div class="text-sm text-gray-500 italic text-center py-4">
              Brak pudełek w szufladzie
            </div>
          } @else {
            @for (box of drawerService.boxes(); track box.id) {
              <button
                type="button"
                class="w-full p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center"
                [class.border-primary]="stateService.selectedBoxId() === box.id"
                [class.bg-blue-50]="stateService.selectedBoxId() === box.id"
                (click)="stateService.selectBox(box.id)"
              >
                <div class="flex items-center gap-2 flex-1 min-w-0">
                    @if (editingBoxId() === box.id) {
                      <input
                        type="text"
                        [value]="box.name"
                        class="w-full text-sm p-1 border rounded"
                        (click)="$event.stopPropagation()"
                        (blur)="saveName($event, box.id)"
                        (keydown.enter)="saveName($event, box.id)"
                        (keydown.escape)="cancelEditing()"
                        autoFocus
                      />
                    } @else {
                      <span
                        class="text-sm font-medium truncate"
                        (dblclick)="startEditing($event, box.id)"
                        title="Kliknij dwukrotnie aby zmienić nazwę"
                      >
                        {{ box.name }}
                      </span>
                    }
                    @if (drawerService.collisions().has(box.id)) {
                      <i class="pi pi-exclamation-triangle text-red-500 text-xs" title="Kolizja"></i>
                    }
                  </div>
                <div
                  class="w-4 h-4 rounded border"
                  [style.background-color]="getBoxColorHex(box.color)"
                ></div>
              </button>
            }
          }
        </div>
      </eligo-sidebar-section>

      <eligo-validation-errors-panel [count]="drawerService.collisions().size" />
    </eligo-ui-sidebar>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ToolsSidebar {
  protected readonly stateService = inject(ConfiguratorStateService);
  protected readonly drawerService = inject(DrawerService);

  editingBoxId = signal<string | null>(null);

  addBox() {
    this.stateService.startAddingBox();

    // Add box with grid units (6x6 grid units = 96x96mm at default 16mm grid)
    this.drawerService.addBox({
      width: 6, // grid units
      depth: 6, // grid units
      height: 50, // mm (height is not grid-based)
      x: 0, // grid units
      y: 0, // grid units
      color: 'white',
      name: 'Pudełko',
    });

    this.stateService.finishAddingBox();
  }

  getBoxColorHex(colorName: string): string {
    const colorDef = BOX_COLORS.find((c) => c.value === colorName);
    return colorDef?.hex || '#ffffff';
  }

  startEditing(event: MouseEvent, boxId: string) {
    event.stopPropagation(); // Prevent selection when starting edit
    this.editingBoxId.set(boxId);
  }

  saveName(event: Event, boxId: string) {
    const input = event.target as HTMLInputElement;
    const newName = input.value.trim();
    if (newName) {
      this.drawerService.updateBox(boxId, { name: newName });
    }
    this.editingBoxId.set(null);
  }

  cancelEditing() {
    this.editingBoxId.set(null);
  }
}

