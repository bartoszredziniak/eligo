import {Component, ChangeDetectionStrategy, input, computed, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {ListboxModule} from 'primeng/listbox';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {FloatLabelModule} from 'primeng/floatlabel';
import {DividerModule} from 'primeng/divider';
import {GridUnitInput} from '../../../../../shared/form-controls/grid-unit-input/grid-unit-input';
import {MmInput} from '../../../../../shared/form-controls/mm-input/mm-input';
import {Box, BOX_COLORS, BoxColor, BOX_PRESETS, BoxPreset} from '../../../../../core/models/drawer.models';
import {GridService} from '../../../../../core/services/grid.service';
import {SidebarSection} from '../../../../../shared/ui/sidebar-section/sidebar-section';
import {DrawerService} from '../../../../../core/services/drawer.service';
import {ConfiguratorStateService} from '../../../../../core/services/configurator-state.service';


@Component({
  selector: 'eligo-box-properties-form',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ListboxModule,
    Select,
    InputText,
    FloatLabelModule,
    DividerModule,
    GridUnitInput,
    MmInput,
    SidebarSection
  ],
  template: `
    <!-- Templates -->
    <ng-template #basicContent>
      <p-floatLabel variant="on">
        <input
          pInputText
          id="box-name"
          [ngModel]="box().name"
          (ngModelChange)="updateName($event)"
          class="w-full"
          pSize="small"
        />
        <label for="box-name">Nazwa</label>
      </p-floatLabel>

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
        <label for="box-preset">Szablon</label>
      </p-floatLabel>
    </ng-template>

    <ng-template #dimensionsContent>
      <eligo-grid-unit-input
        inputId="box-width"
        label="Szerokość"
        [value]="box().width"
        (valueChange)="updateWidth($event)"
        [min]="1"
        [max]="maxWidth()"
      />
      <eligo-grid-unit-input
        inputId="box-depth"
        label="Głębokość"
        [value]="box().depth"
        (valueChange)="updateDepth($event)"
        [min]="1"
        [max]="maxDepth()"
      />
      <eligo-mm-input
        inputId="box-height"
        label="Wysokość"
        [value]="box().height"
        (valueChange)="updateHeight($event)"
        [min]="5"
        [max]="maxHeight()"
      />
    </ng-template>

    <ng-template #appearanceContent>
      <p-listbox
        [options]="availableColors"
        [ngModel]="box().color"
        (ngModelChange)="updateColor($event)"
        optionLabel="label"
        optionValue="value"
        [listStyle]="{'max-height': embedded() ? '250px' : '150px'}"
        styleClass="w-full border-0"
      >
        <ng-template let-color pTemplate="item">
          <div class="flex items-center gap-2 cursor-pointer select-none">
            <div class="w-5 h-5 rounded border border-surface-300 shadow-sm"
                 [style.background-color]="color.hex">
            </div>
            <span class="text-sm">{{ color.label }}</span>
          </div>
        </ng-template>
      </p-listbox>
    </ng-template>

    <!-- Basic Section -->
    @if (isVisible('basic')) {
      @if (embedded()) {
        <div class="flex flex-col gap-4 mb-4">
          <ng-container *ngTemplateOutlet="basicContent" />
        </div>
      } @else {
        <eligo-sidebar-section>
          <span header>Podstawowe</span>
          <div class="flex flex-col gap-4">
            <ng-container *ngTemplateOutlet="basicContent" />
          </div>
        </eligo-sidebar-section>
      }
    }

    <!-- Dimensions Section -->
    @if (isVisible('dimensions')) {
      @if (embedded()) {
        <div class="flex flex-col gap-2 mb-4">
          <ng-container *ngTemplateOutlet="dimensionsContent" />
        </div>
      } @else {
        <eligo-sidebar-section>
          <span header>Wymiary</span>
          <ng-container *ngTemplateOutlet="dimensionsContent" />
        </eligo-sidebar-section>
      }
    }

    <!-- Appearance Section -->
    @if (isVisible('appearance')) {
      @if (embedded()) {
        <div class="mb-4">
          <ng-container *ngTemplateOutlet="appearanceContent" />
        </div>
      } @else {
        <eligo-sidebar-section>
          <span header>Wygląd</span>
          <ng-container *ngTemplateOutlet="appearanceContent" />
        </eligo-sidebar-section>
      }
    }

    <!-- Actions Section -->
    @if (isVisible('actions')) {
      <eligo-sidebar-section>
        <span header>Akcje</span>

        <div class="flex flex-col gap-2">
          <div class="grid grid-cols-2 gap-2">
            <p-button
              label="Duplikuj"
              icon="pi pi-copy"
              severity="secondary"
              outlined="true"
              size="small"
              (onClick)="duplicate()"
              styleClass="w-full"
            />
            <p-button
              label="Obróć"
              icon="pi pi-refresh"
              severity="secondary"
              outlined="true"
              size="small"
              (onClick)="rotate()"
              styleClass="w-full"
            />
          </div>

          <p-button
            label="Usuń"
            icon="pi pi-trash"
            severity="danger"
            size="small"
            (onClick)="deleteBox()"
            styleClass="w-full"
          />
        </div>
      </eligo-sidebar-section>
    }
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxPropertiesForm {
  private readonly gridService = inject(GridService);
  private readonly drawerService = inject(DrawerService);
  private readonly stateService = inject(ConfiguratorStateService);

  box = input.required<Box>();
  drawerHeight = input.required<number>();
  embedded = input(false);
  visibleSections = input<string[]>(['basic', 'dimensions', 'appearance', 'actions']);

  readonly availableColors = BOX_COLORS;
  readonly presets = BOX_PRESETS;
  readonly cellSize = this.gridService.cellSize;
  readonly gridLayout = this.gridService.gridLayout;

  // Computed values
  readonly maxWidth = computed(() => {
    const layout = this.gridLayout();
    return Math.max(1, layout.gridUnitsWidth - this.box().x);
  });

  readonly maxDepth = computed(() => {
    const layout = this.gridLayout();
    return Math.max(1, layout.gridUnitsDepth - this.box().y);
  });

  readonly maxHeight = computed(() => {
    return Math.max(5, this.drawerHeight() - 5);
  });

  isVisible(section: string): boolean {
    return this.visibleSections().includes(section);
  }

  updateWidth(value: number) {
    this.drawerService.updateBox(this.box().id, { width: value });
  }

  updateDepth(value: number) {
    this.drawerService.updateBox(this.box().id, { depth: value });
  }

  updateHeight(value: number) {
    this.drawerService.updateBox(this.box().id, { height: value });
  }

  updateColor(color: BoxColor) {
    this.drawerService.updateBox(this.box().id, { color });
  }

  updateName(name: string) {
    this.drawerService.updateBox(this.box().id, { name });
  }

  applyPreset(preset: BoxPreset | null) {
    if (!preset) return;

    this.updateWidth(preset.width);
    this.updateDepth(preset.depth);

    const currentName = this.box().name;
    const isDefaultName = currentName === 'Pudełko';
    const isPresetName = this.presets.some(p => p.label === currentName);

    if (isDefaultName || isPresetName) {
      this.updateName(preset.label);
    }
  }

  clearPreset() {
    // Optional
  }

  duplicate() {
    this.drawerService.duplicateBox(this.box().id);
  }

  rotate() {
    this.drawerService.rotateBox(this.box().id);
  }

  deleteBox() {
    this.drawerService.removeBox(this.box().id);
    this.stateService.selectBox(null);
  }
}
