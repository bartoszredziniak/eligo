import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ListboxModule } from 'primeng/listbox';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SidebarSection } from '../../../../shared/ui/sidebar-section/sidebar-section';
import { GridUnitInput } from '../../../../shared/form-controls/grid-unit-input/grid-unit-input';
import { MmInput } from '../../../../shared/form-controls/mm-input/mm-input';
import { Box, BOX_COLORS, BoxColor, BOX_PRESETS, BoxPreset } from '../../../models/drawer.models';
import { GridService } from '../../../services/grid.service';


@Component({
  selector: 'eligo-box-properties-form',
  imports: [CommonModule, FormsModule, ButtonModule, ListboxModule, Select, InputText, SidebarSection, GridUnitInput, MmInput, FloatLabelModule],
  template: `
    <eligo-sidebar-section>
      <span header>Edycja Pudełka</span>
      <div class="flex flex-col gap-6">
        <!-- Presets Section -->
        <div class="flex flex-col gap-2">
          <p-floatLabel variant="on">
            <p-select
              inputId="box-preset"
              [options]="presets"
              optionLabel="label"
              (onChange)="applyPreset($event.value)"
              styleClass="w-full"
              [showClear]="true"
              (onClear)="clearPreset()"
              size="small"
            />
            <label for="box-preset">Predefiniowane ustawienia</label>
          </p-floatLabel>
        </div>

        <!-- Name Section -->
        <div class="flex flex-col gap-2">
          <p-floatLabel variant="on">
            <input
              pInputText
              id="box-name"
              [ngModel]="box().name"
              (ngModelChange)="nameChange.emit($event)"
              class="w-full"
              pSize="small"
            />
            <label for="box-name">Nazwa</label>
          </p-floatLabel>
        </div>

        <!-- Position Section -->
        <div class="flex flex-col gap-2">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pozycja</h4>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <eligo-grid-unit-input
                inputId="box-x"
                label="X"
                [value]="box().x"
                (valueChange)="xChange.emit($event)"
                [min]="0"
                [max]="maxX()"
                [narrow]="true"
                [showMmEquivalent]="false"
              />
            </div>
            <div class="flex flex-col gap-1">
              <eligo-grid-unit-input
                inputId="box-y"
                label="Y"
                [value]="box().y"
                (valueChange)="yChange.emit($event)"
                [min]="0"
                [max]="maxY()"
                [narrow]="true"
                [showMmEquivalent]="false"
              />
            </div>
          </div>
          <div class="text-xs text-gray-500">
            Pozycja: {{ xInMm() }}mm × {{ yInMm() }}mm
          </div>
        </div>

        <!-- Dimensions Section -->
        <div class="flex flex-col gap-3">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Wymiary</h4>
          
          <div class="flex flex-col gap-1">
            <eligo-grid-unit-input
              inputId="box-width"
              label="Szerokość"
              [value]="box().width"
              (valueChange)="widthChange.emit($event)"
              [min]="1"
              [max]="maxWidth()"
            />
          </div>

          <div class="flex flex-col gap-1">
            <eligo-grid-unit-input
              inputId="box-depth"
              label="Głębokość"
              [value]="box().depth"
              (valueChange)="depthChange.emit($event)"
              [min]="1"
              [max]="maxDepth()"
            />
          </div>

          <div class="flex flex-col gap-1">
            <eligo-mm-input
              inputId="box-height"
              label="Wysokość"
              [value]="box().height"
              (valueChange)="heightChange.emit($event)"
              [min]="5"
              [max]="maxHeight()"
            />
          </div>
        </div>

        <!-- Color Section -->
        <div class="flex flex-col gap-3">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Kolor</h4>
          <p-listbox
            [options]="availableColors"
            [ngModel]="box().color"
            (ngModelChange)="colorChange.emit($event)"
            optionLabel="label"
            optionValue="value"
            [listStyle]="{'max-height': '250px'}"
            styleClass="w-full"
          >
            <ng-template let-color pTemplate="item">
              <div class="flex items-center gap-3 cursor-pointer select-none">
                <div class="w-6 h-6 rounded-md border border-surface-300 shadow-sm"
                     [style.background-color]="color.hex">
                </div>
                <span>{{ color.label }}</span>
              </div>
            </ng-template>
          </p-listbox>
        </div>

        <!-- Actions Section -->
        <div class="flex flex-col gap-2 mt-2">
          <div class="grid grid-cols-2 gap-2">
            <p-button
              label="Duplikuj"
              icon="pi pi-copy"
              severity="secondary"
              outlined="true"
              (onClick)="duplicate.emit()"
              styleClass="w-full"
            />
            <p-button
              label="Obróć"
              icon="pi pi-refresh"
              severity="secondary"
              outlined="true"
              (onClick)="rotate.emit()"
              styleClass="w-full"
            />
          </div>
          
          <p-button
            label="Usuń Pudełko"
            severity="danger"
            (onClick)="deleteBox.emit()"
            styleClass="w-full"
          />
        </div>
      </div>
    </eligo-sidebar-section>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxPropertiesForm {
  private readonly gridService = inject(GridService);

  box = input.required<Box>();
  drawerHeight = input.required<number>();

  readonly availableColors = BOX_COLORS;
  readonly presets = BOX_PRESETS;
  readonly cellSize = this.gridService.cellSize;
  readonly gridLayout = this.gridService.gridLayout;

  // Computed values for displaying mm equivalents
  readonly xInMm = computed(() => this.gridService.gridUnitsToMm(this.box().x));
  readonly yInMm = computed(() => this.gridService.gridUnitsToMm(this.box().y));
  readonly widthInMm = computed(() => this.gridService.gridUnitsToMm(this.box().width));
  readonly depthInMm = computed(() => this.gridService.gridUnitsToMm(this.box().depth));

  // Dynamic max values based on grid layout and current box dimensions
  readonly maxX = computed(() => {
    const layout = this.gridLayout();
    return Math.max(0, layout.gridUnitsWidth - this.box().width);
  });

  readonly maxY = computed(() => {
    const layout = this.gridLayout();
    return Math.max(0, layout.gridUnitsDepth - this.box().depth);
  });

  readonly maxWidth = computed(() => {
    const layout = this.gridLayout();
    return Math.max(1, layout.gridUnitsWidth - this.box().x);
  });

  readonly maxDepth = computed(() => {
    const layout = this.gridLayout();
    return Math.max(1, layout.gridUnitsDepth - this.box().y);
  });

  readonly maxHeight = computed(() => {
    return Math.max(5, this.drawerHeight() - 5); // 5mm clearance
  });

  xChange = output<number>();
  yChange = output<number>();
  widthChange = output<number>();
  depthChange = output<number>();
  heightChange = output<number>();
  colorChange = output<BoxColor>();
  nameChange = output<string>();
  duplicate = output<void>();
  rotate = output<void>();
  deleteBox = output<void>();

  applyPreset(preset: BoxPreset | null) {
    if (!preset) return;

    // Update dimensions
    this.widthChange.emit(preset.width);
    this.depthChange.emit(preset.depth);

    // Update name logic
    const currentName = this.box().name;
    const isDefaultName = currentName === 'Pudełko';
    const isPresetName = this.presets.some(p => p.label === currentName);

    if (isDefaultName || isPresetName) {
      this.nameChange.emit(preset.label);
    }
  }

  clearPreset() {
    // Optional: reset to default? Or just do nothing.
    // User didn't specify what happens on clear.
  }
}

