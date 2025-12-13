import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FloatLabelModule } from 'primeng/floatlabel';

/**
 * Reusable component for millimeter inputs with consistent styling and unit display
 */
@Component({
  selector: 'eligo-mm-input',
  imports: [FormsModule, InputNumberModule, InputGroupModule, InputGroupAddonModule, FloatLabelModule],
  template: `
    <p-inputGroup>
      <p-floatLabel variant="on" class="flex-1">
        <p-inputNumber
          [inputId]="inputId()"
          [ngModel]="value()"
          (ngModelChange)="valueChange.emit($event ?? 0)"
          [min]="min()"
          [max]="max()"
          [step]="step()"
          [placeholder]="placeholder()"
          styleClass="w-full"
          class="w-full"
          size="small"
        />
        <label [for]="inputId()">{{ label() }}</label>

      </p-floatLabel>
      <p-inputGroupAddon>
        <span class="text-xs">mm</span>
      </p-inputGroupAddon>
    </p-inputGroup>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmInput {
  inputId = input.required<string>();
  label = input.required<string>();
  value = input.required<number>();
  min = input<number>(0);
  max = input<number | undefined>(undefined);
  step = input<number>(1);
  placeholder = input<string>('');

  valueChange = output<number>();
}
