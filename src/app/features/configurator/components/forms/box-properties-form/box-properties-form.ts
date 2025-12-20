import {Component, ChangeDetectionStrategy, input, computed, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {ListboxModule} from 'primeng/listbox';
import {InputText} from 'primeng/inputtext';
import {FloatLabelModule} from 'primeng/floatlabel';
import {DividerModule} from 'primeng/divider';
import {ConfirmationService} from 'primeng/api';
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
    InputText,
    FloatLabelModule,
    DividerModule,
    GridUnitInput,
    MmInput,
    SidebarSection
  ],
  template: `
    <!-- Dynamic Form Sections -->
    <div class="flex flex-col gap-6">
      
      <!-- Basic Info -->
      @if (isVisible('basic')) {
        <eligo-sidebar-section>
          <span header>Pudełko</span>
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
        </eligo-sidebar-section>
      }

      <!-- Templates -->
      @if (isVisible('basic')) {
        <eligo-sidebar-section>
          <span header>Szablony</span>
          <div class="grid grid-cols-2 gap-2">
            @for (preset of presets; track preset.label) {
              <button
                type="button"
                (click)="confirmApplyPreset(preset)"
                class="flex flex-col items-start p-3 text-left transition-all border rounded-lg hover:border-primary-500 hover:bg-primary-50 group border-surface-200"
              >
                <span class="mb-1 text-sm font-semibold text-surface-900 group-hover:text-primary-700">{{ preset.label }}</span>
                <span class="text-xs text-surface-500">{{ preset.width }}x{{ preset.depth }} j.g.</span>
              </button>
            }
          </div>
        </eligo-sidebar-section>
      }

      <!-- Dimensions -->
      @if (isVisible('dimensions')) {
        <eligo-sidebar-section>
          <span header>Wymiary</span>
          <div class="flex flex-col gap-4">
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
          </div>
        </eligo-sidebar-section>
      }

      <!-- Appearance -->
      @if (isVisible('appearance')) {
        <eligo-sidebar-section>
          <span header>Wygląd</span>
          <p-listbox
            [options]="availableColors"
            [ngModel]="box().color"
            (ngModelChange)="updateColor($event)"
            optionLabel="label"
            optionValue="value"
            [listStyle]="{'max-height': embedded() ? '200px' : '150px'}"
            styleClass="w-full border-0"
          >
            <ng-template let-color pTemplate="item">
              <div class="flex items-center gap-2 cursor-pointer select-none">
                <div class="w-5 h-5 rounded border border-surface-300 shadow-sm"
                     [style.background-color]="color.hex">
                </div>
                <span class="text-sm font-medium">{{ color.label }}</span>
              </div>
            </ng-template>
          </p-listbox>
        </eligo-sidebar-section>
      }

      <!-- Actions -->
      @if (isVisible('actions')) {
        <eligo-sidebar-section>
          <span header>Akcje</span>
          <div class="flex flex-col gap-2">
            <div class="grid grid-cols-2 gap-2">
              <p-button
                label="Duplikuj"
                icon="pi pi-copy"
                severity="secondary"
                [outlined]="true"
                size="small"
                (onClick)="duplicate()"
                class="w-full"
                styleClass="w-full"
              />
              <p-button
                label="Obróć"
                icon="pi pi-refresh"
                severity="secondary"
                [outlined]="true"
                size="small"
                (onClick)="rotate()"
                class="w-full"
                styleClass="w-full"
              />
            </div>

            <p-button
              label="Usuń"
              icon="pi pi-trash"
              severity="danger"
              size="small"
              (onClick)="deleteBox()"
              class="w-full"
              styleClass="w-full"
            />
          </div>
        </eligo-sidebar-section>
      }
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxPropertiesForm {
  private readonly gridService = inject(GridService);
  private readonly drawerService = inject(DrawerService);
  private readonly stateService = inject(ConfiguratorStateService);
  private readonly confirmationService = inject(ConfirmationService);

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

  confirmApplyPreset(preset: BoxPreset) {
    this.confirmationService.confirm({
      message: `Zastosowanie szablonu "<strong>${preset.label}</strong>" zmieni wymiary pudełka na <strong>${preset.width}x${preset.depth} j.g.</strong> oraz jego nazwę. Czy na pewno chcesz kontynuować?`,
      header: 'Potwierdzenie zmiany szablonu',
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Anuluj',
      rejectButtonProps: {
        label: 'Anuluj',
        severity: 'secondary',
        outlined: true,
      },
      acceptLabel: 'Zastosuj',
      acceptButtonProps: {
        label: 'Zastosuj',
        severity: 'primary',
      },
      accept: () => {
        this.applyPreset(preset);
      }
    });
  }

  private applyPreset(preset: BoxPreset) {
    this.updateWidth(preset.width);
    this.updateDepth(preset.depth);

    const currentName = this.box().name;
    const isDefaultName = currentName === 'Pudełko' || !currentName;
    const isPresetName = this.presets.some(p => p.label === currentName);

    if (isDefaultName || isPresetName) {
      this.updateName(preset.label);
    }
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
