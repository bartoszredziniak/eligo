import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ListboxModule } from 'primeng/listbox';
import { UiSidebar } from '../../../shared/ui/ui-sidebar/ui-sidebar';
import { SidebarSection } from '../../../shared/ui/sidebar-section/sidebar-section';
import { ConfiguratorStateService } from '../../services/configurator-state.service';
import { DrawerService } from '../../services/drawer.service';
import { BOX_COLORS } from '../../models/drawer.models';

import { ValidationErrorsPanel } from '../../../features/configurator/components/validation-errors-panel/validation-errors-panel';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'eligo-tools-sidebar',
  imports: [CommonModule, FormsModule, ButtonModule, ListboxModule, UiSidebar, SidebarSection, ValidationErrorsPanel, EmptyState],
  template: `
    <eligo-ui-sidebar>
      <eligo-sidebar-section>
        <span header>Narzędzia</span>
        <div class="flex flex-col gap-2">
          <p-button
            label="Dodaj Pudełko"
            icon="pi pi-plus"
            styleClass="w-full"
            (onClick)="addBox()"
          />
        </div>
      </eligo-sidebar-section>

      <eligo-sidebar-section>
        <span header>Lista Elementów</span>
        <div class="flex flex-col gap-2">
          <p-listbox
            [options]="items()"
            [ngModel]="stateService.selectedBoxId()"
            (ngModelChange)="stateService.selectBox($event)"
            optionLabel="name"
            optionValue="id"
            styleClass="w-full border-none p-0"
            [listStyle]="{'max-height': 'calc(100vh - 300px)'}"
          >
            <ng-template let-item pTemplate="item">
              <div class="flex items-center justify-between w-full gap-2">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  @if (item.type === 'drawer') {
                    <span class="text-sm font-medium">Szuflada</span>
                    <i class="pi pi-box ml-auto text-surface-400"></i>
                  } @else {
                    @if (editingBoxId() === item.id) {
                      <input
                        type="text"
                        [value]="item.name"
                        class="w-full text-sm p-1 border rounded"
                        (click)="$event.stopPropagation()"
                        (blur)="saveName($event, item.id)"
                        (keydown.enter)="saveName($event, item.id)"
                        (keydown.escape)="cancelEditing()"
                        autoFocus
                      />
                    } @else {
                      <span
                        class="text-sm font-medium truncate"
                        (dblclick)="startEditing($event, item.id)"
                        title="Kliknij dwukrotnie aby zmienić nazwę"
                      >
                        {{ item.name }}
                      </span>
                    }
                    @if (getBoxError(item.id); as error) {
                      @if (error.type === 'collision') {
                        <i class="pi pi-exclamation-triangle text-red-500 text-xs" title="Kolizja"></i>
                      } @else if (error.type === 'boundary') {
                        <i class="pi pi-arrows-alt text-orange-500 text-xs" title="Wystaje poza szufladę - kliknij aby przesunąć"></i>
                      } @else if (error.type === 'oversized') {
                        <i class="pi pi-ban text-red-500 text-xs" title="Za duże - zmień rozmiar"></i>
                      }
                    }
                  }
                </div>
                
                @if (item.type === 'box') {
                  <div
                    class="w-5 h-5 rounded border-2 border-surface-300 shadow-sm"
                    [style.background-color]="getBoxColorHex(item.color)"
                  ></div>
                }
              </div>
            </ng-template>
          </p-listbox>

          @if (drawerService.boxes().length === 0) {
            <eligo-empty-state
              [mini]="true"
              icon="pi-inbox"
              header="Brak pudełek"
              description="Dodaj pudełko aby rozpocząć"
            />
          }
        </div>
      </eligo-sidebar-section>

      <eligo-validation-errors-panel [errors]="drawerService.validationErrors()" />
    </eligo-ui-sidebar>
  `,
  styles: [`
    :host ::ng-deep .p-listbox {
      border: none;
      padding: 0;
    }
    :host ::ng-deep .p-listbox .p-listbox-list .p-listbox-item {
      padding: 0.75rem;
      border-radius: 6px;
      margin-bottom: 4px;
      border: 1px solid transparent;
    }
    :host ::ng-deep .p-listbox .p-listbox-list .p-listbox-item.p-highlight {
      background: var(--primary-50);
      color: var(--primary-700);
      border-color: var(--primary-500);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ToolsSidebar {
  protected readonly stateService = inject(ConfiguratorStateService);
  protected readonly drawerService = inject(DrawerService);

  editingBoxId = signal<string | null>(null);

  items = computed(() => {
    const drawerItem = { id: null, name: 'Szuflada', type: 'drawer', color: null };
    const boxes = this.drawerService.boxes().map(box => ({
      id: box.id,
      name: box.name,
      type: 'box',
      color: box.color,
      box: box
    }));
    return [drawerItem, ...boxes];
  });

  addBox() {
    this.stateService.startAddingBox();

    const width = 6; // grid units
    const depth = 6; // grid units
    
    // Try to find first free position
    const freePosition = this.drawerService.findFirstFreePosition(width, depth);
    
    // Use free position or default to (0,0) if drawer is full
    const { x, y } = freePosition || { x: 0, y: 0 };

    // Add box with grid units (6x6 grid units = 96x96mm at default 16mm grid)
    this.drawerService.addBox({
      width,
      depth,
      height: 50, // mm (height is not grid-based)
      x,
      y,
      color: 'white',
      name: 'Pudełko',
    });

    this.stateService.finishAddingBox();
  }

  getBoxColorHex(colorName: string | null | undefined): string {
    if (!colorName) return '#ffffff';
    const colorDef = BOX_COLORS.find((c) => c.value === colorName);
    return colorDef?.hex || '#ffffff';
  }

  getBoxError(boxId: string | null) {
    if (!boxId) return undefined;
    return this.drawerService.validationErrors().find(e => e.boxId === boxId);
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

