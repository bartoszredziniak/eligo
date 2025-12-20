import { Component, ChangeDetectionStrategy, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Clipboard } from '@angular/cdk/clipboard';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { APP_CONFIG } from '../../config/app.config';

@Component({
  selector: 'eligo-mobile-summary-bar',
  imports: [CommonModule, ButtonModule, ToastModule, DialogModule],
  providers: [MessageService],
  template: `
    <!-- Compact Summary Bar -->
    <div class="bg-white/95 backdrop-blur-md border-t border-surface-200 px-4 py-2 flex items-center justify-between shadow-lg relative z-40">
      <div class="flex items-center gap-4">
        <div class="flex flex-col">
          <span class="text-[9px] text-surface-500 uppercase tracking-widest font-bold">Suma</span>
          <span class="text-sm font-bold text-surface-900 leading-none">{{ price() | number: '1.2-2' }} <span class="text-[10px]">PLN</span></span>
        </div>
        <div class="h-6 w-px bg-surface-200"></div>
        <div class="flex flex-col">
          <span class="text-[9px] text-surface-500 uppercase tracking-widest font-bold">Waga</span>
          <span class="text-sm font-medium text-surface-600 leading-none">{{ weight() | number: '1.0-0' }}g</span>
        </div>
      </div>
      
      <p-button
        label="Szczegóły"
        icon="pi pi-receipt"
        [rounded]="true" 
        size="small"
        severity="primary"
        [raised]="true"
        (onClick)="detailsVisible.set(true)"
      />
    </div>

    <!-- Details Dialog -->
    <p-dialog
      header="Szczegóły zamówienia"
      [(visible)]="detailsVisible"
      [modal]="true"
      [dismissableMask]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '90vw', maxWidth: '400px' }"
      appendTo="body"
    >
      <div class="flex flex-col gap-6 py-2">
        <!-- Totals Card -->
        <div class="bg-primary-50 rounded-xl p-5 border border-primary-100 flex items-center justify-between shadow-xs">
          <div class="flex flex-col">
            <span class="text-[10px] text-primary-600 font-bold uppercase tracking-widest mb-1">Do zapłaty</span>
            <span class="text-3xl font-black text-primary-900 leading-none">{{ price() | number: '1.2-2' }} <span class="text-sm">PLN</span></span>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-primary-500 block font-bold uppercase tracking-widest mb-1">Waga</span>
            <span class="text-lg font-bold text-primary-800 leading-none">{{ weight() | number: '1.0-0' }}g</span>
          </div>
        </div>

        <!-- Configuration Code -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <h4 class="text-xs font-bold text-surface-500 uppercase tracking-widest">Kod konfiguracji</h4>
            <div class="h-px bg-surface-100 grow"></div>
          </div>
          <p class="text-[11px] text-surface-500 leading-snug italic">Będzie Ci potrzebny podczas składania zamówienia na Allegro.</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-surface-50 p-3 rounded-lg border border-surface-200 text-sm text-surface-700 font-mono break-all leading-tight shadow-inner">
              {{ configCode() }}
            </code>
            <p-button 
              icon="pi pi-copy" 
              [rounded]="true" 
              severity="secondary"
              [outlined]="true"
              (onClick)="copyCode()"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-3">
          <p-button
            label="Złóż zamówienie online"
            icon="pi pi-shopping-cart"
            class="w-full"
            styleClass="w-full"
            severity="secondary"
            [text]="true"
            (onClick)="openShop()"
          />
          <p-button
            label="Generuj PDF z zamówieniem"
            icon="pi pi-file-pdf"
            class="w-full"
            styleClass="w-full"
            [raised]="true"
            (onClick)="onGenerateOrder()"
          />
        </div>
      </div>
    </p-dialog>

    <p-toast position="bottom-center" [life]="2000" />
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileSummaryBar {
  protected readonly shopLink = APP_CONFIG.shopLink;
  price = input.required<number>();
  weight = input.required<number>();
  configCode = input.required<string>();
  generateOrder = output<void>();

  protected detailsVisible = signal(false);

  private clipboard = inject(Clipboard);
  private messageService = inject(MessageService);

  copyCode() {
    if (this.clipboard.copy(this.configCode())) {
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Skopiowano', 
        detail: 'Kod konfiguracji jest w schowku',
        life: 2000
      });
    }
  }

  openShop() {
    window.open(this.shopLink, '_blank');
  }

  onGenerateOrder() {
    this.detailsVisible.set(false);
    this.generateOrder.emit();
  }
}
