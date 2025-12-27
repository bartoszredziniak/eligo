import { Component, ChangeDetectionStrategy, output, input, signal } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { UiHeader } from '../../../shared/ui/ui-header/ui-header';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'eligo-header',
  imports: [CommonModule, NgOptimizedImage, ButtonModule, DrawerModule, UiHeader, TooltipModule],
  template: `
    <eligo-ui-header>
      <div start class="flex items-center gap-2">
        <img ngSrc="/eligo-logo.svg" alt="Eligo" width="120" height="24" priority />
      </div>

      <div end class="flex items-center gap-2">
        <!-- Always Visible Actions -->
        <p-button
          icon="pi pi-plus"
          label="Dodaj pudełko"
          [rounded]="true"
          size="small"
          severity="primary"
          styleClass="whitespace-nowrap"
          (onClick)="addBoxClicked.emit()"
        />

        <!-- Mobile Price Display -->
        <div class="flex flex-col items-end mr-2 md:hidden">
          <span class="text-[9px] text-surface-500 uppercase tracking-widest font-bold">Suma</span>
          <span class="text-sm font-bold text-surface-900 leading-none">{{ price() | number: '1.2-2' }} <span class="text-[10px]">PLN</span></span>
        </div>

        <!-- Desktop Buttons Wrapper -->
        <div class="hidden md:flex items-center gap-2">
          <p-button
            icon="pi pi-history"
            label="Wczytaj"
            [text]="true"
            severity="secondary"
            pTooltip="Wczytaj konfigurację z kodu"
            tooltipPosition="bottom"
            (onClick)="restoreClicked.emit()"
          />
          <p-button
            icon="pi pi-question-circle"
            label="Pomoc"
            [text]="true"
            severity="secondary"
            ariaLabel="Help"
            (onClick)="helpClicked.emit()"
          />
        </div>

        <!-- Mobile Hamburger Menu Wrapper -->
        <div class="md:hidden">
          <p-button
            icon="pi pi-bars"
            [text]="true"
            severity="secondary"
            (onClick)="menuVisible.set(true)"
          />
        </div>

        <!-- Mobile Side Menu (Drawer) -->
        <p-drawer 
          [(visible)]="menuVisible" 
          position="right" 
          [modal]="true"
          [blockScroll]="true"
          styleClass="w-[80vw] md:w-[20rem]"
        >
          <ng-template #header>
            <div class="flex items-center gap-2">
              <span class="font-bold text-lg">Menu</span>
            </div>
          </ng-template>
          
          <div class="flex flex-col gap-2">
            <p-button
              icon="pi pi-history"
              label="Wczytaj konfigurację"
              [text]="true"
              severity="secondary"
              styleClass="w-full !justify-start !text-left px-4"
              (onClick)="restoreClicked.emit(); menuVisible.set(false)"
            />
            <p-button
              icon="pi pi-question-circle"
              label="Pomoc"
              [text]="true"
              severity="secondary"
              styleClass="w-full !justify-start !text-left px-4"
              (onClick)="helpClicked.emit(); menuVisible.set(false)"
            />
          </div>
        </p-drawer>
      </div>
    </eligo-ui-header>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  price = input.required<number>();
  
  addBoxClicked = output<void>();

  helpClicked = output<void>();
  restoreClicked = output<void>();

  menuVisible = signal(false);
}