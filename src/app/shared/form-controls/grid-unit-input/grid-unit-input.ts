import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { GridService } from '../../../core/services/grid.service';

/**
 * Reusable component for grid unit inputs with mm conversion display
 */
@Component({
  selector: 'eligo-grid-unit-input',
  imports: [FormsModule, InputNumberModule, InputGroupModule, InputGroupAddonModule],
  template: `
    <p-inputGroup>
      <p-inputNumber
        [inputId]="inputId()"
        [ngModel]="value()"
        (ngModelChange)="valueChange.emit($event ?? 0)"
        [min]="min()"
        [max]="max()"
        [step]="1"
        [placeholder]="placeholder()"
        [styleClass]="narrow() ? 'w-20' : 'w-full'"
        [class]="narrow() ? '' : 'flex-1'"
      />
      <p-inputGroupAddon>
        <span class="text-xs">{{ gridUnitsLabel() }}</span>
      </p-inputGroupAddon>
    </p-inputGroup>
    @if (showMmEquivalent()) {
      <span class="text-xs text-gray-500 mt-1">{{ valueInMm() }}mm</span>
    }
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridUnitInput {
  private readonly gridService = inject(GridService);

  inputId = input.required<string>();
  value = input.required<number>();
  min = input<number>(0);
  max = input<number | undefined>(undefined);
  placeholder = input<string>('');
  narrow = input<boolean>(false);
  showMmEquivalent = input<boolean>(true);

  readonly valueInMm = computed(() => this.gridService.gridUnitsToMm(this.value()));
  readonly cellSize = this.gridService.cellSize;
  readonly gridUnitsLabel = computed(() => `× ${this.cellSize()}mm`);

  valueChange = output<number>();
}
