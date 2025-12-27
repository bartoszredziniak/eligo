import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Clipboard } from '@angular/cdk/clipboard';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { APP_CONFIG } from '../../config/app.config';

@Component({
  selector: 'eligo-mobile-summary-view',
  imports: [CommonModule, ButtonModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="flex flex-col h-full bg-surface-50">
      <div class="flex-none p-4 bg-white border-b border-surface-200">
        <h2 class="text-xl font-bold text-surface-900 m-0">Podsumowanie</h2>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- Totals Card -->
        <div class="bg-primary-50 rounded-2xl p-6 border border-primary-100 flex items-center justify-between shadow-sm">
          <div class="flex flex-col">
            <span class="text-[10px] text-primary-600 font-bold uppercase tracking-widest mb-1">Do zapłaty</span>
            <span class="text-4xl font-black text-primary-900 leading-none">{{ price() | number: '1.2-2' }} <span class="text-base">PLN</span></span>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-primary-500 block font-bold uppercase tracking-widest mb-1">Waga</span>
            <span class="text-xl font-bold text-primary-800 leading-none">{{ weight() | number: '1.0-0' }}g</span>
          </div>
        </div>

        <!-- Configuration Code -->
        <div class="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm space-y-4">
          <div class="flex items-center gap-2">
            <h4 class="text-xs font-bold text-surface-500 uppercase tracking-widest">Kod konfiguracji</h4>
            <div class="h-px bg-surface-100 grow"></div>
          </div>
          <p class="text-xs text-surface-500 leading-relaxed">
            Ten kod zawiera wszystkie informacje o Twoim projekcie. Będzie Ci potrzebny podczas składania zamówienia na Allegro.
          </p>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-surface-50 p-4 rounded-xl border border-surface-100 text-sm text-surface-700 font-mono break-all leading-tight shadow-inner">
              {{ configCode() }}
            </code>
            <p-button 
              icon="pi pi-copy" 
              [rounded]="true" 
              severity="secondary"
              [outlined]="true"
              (onClick)="copyCode()"
              size="large"
            />
          </div>
        </div>

        <!-- How to Order -->
        <div class="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm space-y-4">
          <div class="flex items-center gap-2">
            <h4 class="text-xs font-bold text-surface-500 uppercase tracking-widest">Jak zamówić?</h4>
            <div class="h-px bg-surface-100 grow"></div>
          </div>
          <ul class="list-none p-0 m-0 space-y-4">
            <li class="flex gap-4">
              <div class="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <p class="text-sm text-surface-600 leading-snug">Przejdź na naszą aukcję Allegro przyciskiem poniżej.</p>
            </li>
            <li class="flex gap-4">
              <div class="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <p class="text-sm text-surface-600 leading-snug">Wybierz odpowiednią liczbę sztuk produktu.</p>
            </li>
            <li class="flex gap-4">
              <div class="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <p class="text-sm text-surface-600 leading-snug">W wiadomości do sprzedającego wklej <strong>Kod konfiguracji</strong>.</p>
            </li>
          </ul>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex-none p-4 bg-white border-t border-surface-200 space-y-3">
        <p-button
          label="Złóż zamówienie na Allegro"
          icon="pi pi-shopping-cart"
          class="w-full"
          styleClass="w-full h-12 text-lg"
          [raised]="true"
          (onClick)="openShop()"
        />
        <p-button
          label="Pobierz PDF z zamówieniem"
          icon="pi pi-file-pdf"
          class="w-full"
          styleClass="w-full h-12 text-lg"
          [text]="true"
          severity="secondary"
          (onClick)="generateOrder.emit()"
        />
      </div>
    </div>

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
}
