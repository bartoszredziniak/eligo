import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { UiSidebar } from '../../../shared/ui/ui-sidebar/ui-sidebar';
import { SidebarSection } from '../../../shared/ui/sidebar-section/sidebar-section';
import { ConfiguratorStateService } from '../../services/configurator-state.service';
import { DrawerService } from '../../services/drawer.service';
import { BOX_COLORS } from '../../models/drawer.models';

@Component({
  selector: 'eligo-tools-sidebar',
  imports: [CommonModule, ButtonModule, UiSidebar, SidebarSection],
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
                <span class="text-sm font-medium">Pudełko</span>
                <div
                  class="w-4 h-4 rounded border"
                  [style.background-color]="getBoxColorHex(box.color)"
                ></div>
              </button>
            }
          }
        </div>
      </eligo-sidebar-section>
    </eligo-ui-sidebar>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolsSidebar {
  protected readonly stateService = inject(ConfiguratorStateService);
  protected readonly drawerService = inject(DrawerService);

  addBox() {
    this.stateService.startAddingBox();

    // Temporary: Immediately add box for testing logic
    // In real implementation, this would happen after drag & drop
    this.drawerService.addBox({
      width: 100,
      depth: 100,
      height: 50,
      x: 0,
      y: 0,
      color: 'white',
    });

    this.stateService.finishAddingBox();
  }

  getBoxColorHex(colorName: string): string {
    const colorDef = BOX_COLORS.find((c) => c.value === colorName);
    return colorDef?.hex || '#ffffff';
  }
}
