import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'eligo-mobile-summary-bar',
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex flex-col">
          <span class="text-[10px] text-gray-400 uppercase tracking-wide">Koszt</span>
          <span class="text-sm font-bold text-gray-900">{{ price() | number: '1.2-2' }} PLN</span>
        </div>
        <div class="h-6 w-px bg-gray-200"></div>
        <div class="flex flex-col">
          <span class="text-[10px] text-gray-400 uppercase tracking-wide">Waga</span>
          <span class="text-sm font-medium text-gray-600">{{ weight() | number: '1.0-0' }}g</span>
        </div>
      </div>
      
      <p-button
        icon="pi pi-check"
        label="Zamów"
        [rounded]="true" 
        size="small"
        (onClick)="generateOrder.emit()"
      />
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileSummaryBar {
  price = input.required<number>();
  weight = input.required<number>();
  generateOrder = output<void>();
}
