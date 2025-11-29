import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { SidebarSection } from '../../../../shared/ui/sidebar-section/sidebar-section';
import { GridUnitInput } from '../../../../shared/form-controls/grid-unit-input/grid-unit-input';
import { MmInput } from '../../../../shared/form-controls/mm-input/mm-input';
import { Box, BOX_COLORS, BoxColor, BOX_PRESETS, BoxPreset } from '../../../models/drawer.models';
import { GridService } from '../../../services/grid.service';


@Component({
  selector: 'eligo-box-properties-form',
  imports: [CommonModule, FormsModule, ButtonModule, RadioButtonModule, Select, InputText, SidebarSection, GridUnitInput, MmInput],
  template: `
    <eligo-sidebar-section title="Edycja Pudełka">
      <div class="flex flex-col gap-6">
        <!-- Presets Section -->
        <div class="flex flex-col gap-2">
          <label for="box-preset" class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Predefiniowane ustawienia</label>
          <p-select
            inputId="box-preset"
            [options]="presets"
            optionLabel="label"
            placeholder="Wybierz konfigurację"
            (onChange)="applyPreset($event.value)"
            styleClass="w-full"
            [showClear]="true"
            (onClear)="clearPreset()"
          />
        </div>

        <!-- Name Section -->
        <div class="flex flex-col gap-2">
          <label for="box-name" class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nazwa</label>
          <input
            pInputText
            id="box-name"
            [ngModel]="box().name"
            (ngModelChange)="nameChange.emit($event)"
            class="w-full"
          />
        </div>

        <!-- Position Section -->
        <div class="flex flex-col gap-2">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pozycja</h4>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label for="box-x" class="text-sm font-medium text-gray-700">X</label>
              <eligo-grid-unit-input
                inputId="box-x"
                [value]="box().x"
                (valueChange)="xChange.emit($event)"
                [min]="0"
                [max]="maxX()"
                [narrow]="true"
                [showMmEquivalent]="false"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label for="box-y" class="text-sm font-medium text-gray-700">Y</label>
              <eligo-grid-unit-input
                inputId="box-y"
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
            <label for="box-width" class="text-sm font-medium text-gray-700">Szerokość</label>
            <eligo-grid-unit-input
              inputId="box-width"
              [value]="box().width"
              (valueChange)="widthChange.emit($event)"
              [min]="1"
              [max]="maxWidth()"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="box-depth" class="text-sm font-medium text-gray-700">Głębokość</label>
            <eligo-grid-unit-input
              inputId="box-depth"
              [value]="box().depth"
              (valueChange)="depthChange.emit($event)"
              [min]="1"
              [max]="maxDepth()"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="box-height" class="text-sm font-medium text-gray-700">Wysokość</label>
            <eligo-mm-input
              inputId="box-height"
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
          <div class="grid grid-cols-1 gap-2">
            @for (color of availableColors; track color.value) {
              <div class="flex items-center gap-2 p-2 rounded border transition-colors"
                   [class.border-primary]="box().color === color.value"
                   [class.bg-blue-50]="box().color === color.value">
                <p-radioButton
                  [inputId]="'color-' + color.value"
                  [value]="color.value"
                  [ngModel]="box().color"
                  (ngModelChange)="colorChange.emit($event)"
                />
                <div class="w-6 h-6 rounded border border-gray-300"
                     [style.background-color]="color.hex">
                </div>
                <label [for]="'color-' + color.value" class="text-sm font-medium cursor-pointer flex-1">
                  {{ color.label }}
                </label>
              </div>
            }
          </div>
        </div>

        <!-- Delete Button -->
        <p-button
          label="Usuń Pudełko"
          severity="danger"
          (onClick)="deleteBox.emit()"
          styleClass="w-full"
        />
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

