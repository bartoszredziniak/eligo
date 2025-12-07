import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { MmInput } from '../../../../shared/form-controls/mm-input/mm-input';
import { DrawerConfig } from '../../../models/drawer.models';
import { GridService } from '../../../services/grid.service';

@Component({
  selector: 'eligo-drawer-properties-form',
  imports: [CommonModule, DividerModule, MmInput],
  template: `
    <div class="flex flex-col gap-4">
      <!-- Dimensions Section -->
      <section>
        <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Wymiary szuflady</h4>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <eligo-mm-input
              inputId="drawer-width"
              label="Szerokość"
              [value]="config().width"
              (valueChange)="widthChange.emit($event)"
              [min]="200"
              [max]="1200"
            />
            <span class="text-xs text-gray-400">{{ gridUnitsWidth() }} komórek ({{ cellSize() }}mm)</span>
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
            <span class="text-xs text-gray-400">{{ gridUnitsDepth() }} komórek ({{ cellSize() }}mm)</span>
          </div>

          <eligo-mm-input
            inputId="drawer-height"
            label="Wysokość"
            [value]="config().height"
            (valueChange)="heightChange.emit($event)"
            [min]="30"
            [max]="300"
          />
        </div>
      </section>
    </div>
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
