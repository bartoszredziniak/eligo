import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { UiBottomBar } from '../../../shared/ui/ui-bottom-bar/ui-bottom-bar';
import { TooltipModule } from 'primeng/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { APP_CONFIG } from '../../config/app.config';

@Component({
  selector: 'eligo-summary-bar',
  imports: [CommonModule, ButtonModule, UiBottomBar, TooltipModule, ToastModule],
  providers: [MessageService],
  template: `
    <eligo-ui-bottom-bar>
      <div class="flex items-center gap-4">
        <div class="flex flex-col">
          <span class="text-xs text-gray-500 uppercase tracking-wide">Szacowany koszt</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-gray-900"> {{ price() | number: '1.2-2' }} PLN </span>
            <span class="text-sm text-gray-500"> ({{ weight() | number: '1.0-0' }}g) </span>
          </div>
        </div>

        <div class="h-8 w-px bg-gray-200 mx-2"></div>

        <div class="flex flex-col">
           <span class="text-xs text-gray-500 uppercase tracking-wide">Kod Konfiguracji</span>
           <div class="flex items-center gap-2">
             <code class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono max-w-[200px] truncate" [title]="configCode()">
               {{ configCode() }}
             </code>
             <p-button 
               icon="pi pi-copy" 
               [text]="true" 
               [rounded]="true" 
               size="small" 
               severity="secondary"
               pTooltip="Skopiuj kod"
               tooltipPosition="top"
               (onClick)="copyCode()"
             />
           </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <p-button
          label="Złóż zamówienie online"
          icon="pi pi-shopping-cart"
          [text]="true"
          severity="secondary"
          (onClick)="openShop()"
        />
        <p-button
        label="Generuj Zamówienie"
        icon="pi pi-check"
        [rounded]="true"
        (onClick)="generateOrder.emit()"
        />
      </div>
    </eligo-ui-bottom-bar>
    <p-toast position="bottom-center" />
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryBar {
  protected readonly shopLink = APP_CONFIG.shopLink;
  price = input.required<number>();
  weight = input.required<number>();
  configCode = input.required<string>();
  generateOrder = output<void>();

  private clipboard = inject(Clipboard);
  private messageService = inject(MessageService);

  copyCode() {
    if (this.clipboard.copy(this.configCode())) {
      this.messageService.add({ severity: 'success', summary: 'Skopiowano', detail: 'Kod konfiguracji został skopiowany do schowka' });
    }
  }

  openShop() {
    window.open(this.shopLink, '_blank');
  }
}
