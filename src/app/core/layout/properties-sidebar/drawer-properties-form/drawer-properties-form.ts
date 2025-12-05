import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarSection } from '../../../../shared/ui/sidebar-section/sidebar-section';
import { MmInput } from '../../../../shared/form-controls/mm-input/mm-input';
import { DrawerConfig } from '../../../models/drawer.models';
import { GridService } from '../../../services/grid.service';

@Component({
  selector: 'eligo-drawer-properties-form',
  imports: [CommonModule, SidebarSection, MmInput],
  template: `
    <eligo-sidebar-section>
      <span header>Ustawienia Szuflady</span>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <eligo-mm-input
            inputId="drawer-width"
            label="Szerokość"
            [value]="config().width"
            (valueChange)="widthChange.emit($event)"
            [min]="200"
            [max]="1200"
          />
          <span class="text-xs text-gray-500">{{ gridUnitsWidth() }} komórek siatki ({{ cellSize() }}mm)</span>
        </div>

        <div class="flex flex-col gap-1">
          <eligo-mm-input
            inputId="drawer-depth"
            label="Głębokość"
            [value]="config().depth"
            (valueChange)="depthChange.emit($event)"
            [min]="200"
            [max]="1200"
          />
          <span class="text-xs text-gray-500">{{ gridUnitsDepth() }} komórek siatki ({{ cellSize() }}mm)</span>
        </div>

        <div class="flex flex-col gap-1">
          <eligo-mm-input
            inputId="drawer-height"
            label="Wysokość"
            [value]="config().height"
            (valueChange)="heightChange.emit($event)"
            [min]="30"
            [max]="300"
          />
        </div>
      </div>
    </eligo-sidebar-section>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerPropertiesForm {
  private readonly gridService = inject(GridService);

  config = input.required<DrawerConfig>();

  readonly cellSize = this.gridService.cellSize;
  readonly gridUnitsWidth = computed(() => Math.floor(this.config().width / this.cellSize()));
  readonly gridUnitsDepth = computed(() => Math.floor(this.config().depth / this.cellSize()));

  widthChange = output<number>();
  depthChange = output<number>();
  heightChange = output<number>();
}
