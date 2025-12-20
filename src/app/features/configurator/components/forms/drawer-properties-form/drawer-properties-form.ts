import {Component, ChangeDetectionStrategy, input, computed, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DividerModule} from 'primeng/divider';
import {MmInput} from '../../../../../shared/form-controls/mm-input/mm-input';
import {DrawerConfig} from '../../../../../core/models/drawer.models';
import {GridService} from '../../../../../core/services/grid.service';
import {SidebarSection} from '../../../../../shared/ui/sidebar-section/sidebar-section';
import {DrawerService} from '../../../../../core/services/drawer.service';

@Component({
  selector: 'eligo-drawer-properties-form',
  imports: [CommonModule, DividerModule, MmInput, SidebarSection],
  template: `
    <div class="flex flex-col gap-8">
      <eligo-sidebar-section>
        <span header>Wymiary szuflady</span>
        
        <div class="flex flex-col gap-6">
          <eligo-mm-input
            inputId="drawer-width"
            label="Szerokość"
            [value]="config().width"
            (valueChange)="updateWidth($event)"
            [min]="200"
            [max]="1200"
          >
            <span class="text-xs text-surface-500 mt-1 block">{{ gridUnitsWidth() }} komórek ({{ cellSize() }}mm)</span>
          </eligo-mm-input>

          <eligo-mm-input
            inputId="drawer-depth"
            label="Głębokość"
            [value]="config().depth"
            (valueChange)="updateDepth($event)"
            [min]="200"
            [max]="1200"
          >
            <span class="text-xs text-surface-500 mt-1 block">{{ gridUnitsDepth() }} komórek ({{ cellSize() }}mm)</span>
          </eligo-mm-input>

          <eligo-mm-input
            inputId="drawer-height"
            label="Wysokość"
            [value]="config().height"
            (valueChange)="updateHeight($event)"
            [min]="30"
            [max]="300"
          />
        </div>
      </eligo-sidebar-section>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerPropertiesForm {
  private readonly gridService = inject(GridService);
  private readonly drawerService = inject(DrawerService);

  config = input.required<DrawerConfig>();
  embedded = input(false);

  readonly cellSize = this.gridService.cellSize;
  readonly gridUnitsWidth = computed(() => Math.floor(this.config().width / this.cellSize()));
  readonly gridUnitsDepth = computed(() => Math.floor(this.config().depth / this.cellSize()));

  updateWidth(value: number) {
    this.drawerService.updateDrawerConfig({ width: value });
  }

  updateDepth(value: number) {
    this.drawerService.updateDrawerConfig({ depth: value });
  }

  updateHeight(value: number) {
    this.drawerService.updateDrawerConfig({ height: value });
  }
}
