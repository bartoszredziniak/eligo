import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { UiBottomBar } from '../../../shared/ui/ui-bottom-bar/ui-bottom-bar';

@Component({
  selector: 'eligo-summary-bar',
  imports: [CommonModule, ButtonModule, UiBottomBar],
  template: `
    <eligo-ui-bottom-bar>
      <div class="flex flex-col">
        <span class="text-xs text-gray-500 uppercase tracking-wide">Szacowany koszt</span>
        <span class="text-2xl font-bold text-gray-900"> {{ price() | number: '1.2-2' }} PLN </span>
      </div>

      <p-button
        label="Generuj Zamówienie"
        icon="pi pi-check"
        [rounded]="true"
        (onClick)="generateOrder.emit()"
      />
    </eligo-ui-bottom-bar>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryBar {
  price = input.required<number>();
  generateOrder = output<void>();
}
