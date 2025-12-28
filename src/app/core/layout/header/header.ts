import { Component, ChangeDetectionStrategy, output, input, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MenuItem } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { UiHeader } from '../../../shared/ui/ui-header/ui-header';
import { TooltipModule } from 'primeng/tooltip';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { BOX_PRESETS, BoxPreset } from '../../../core/models/drawer.models';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'eligo-header',
  imports: [CommonModule, ButtonModule, SplitButtonModule, DrawerModule, UiHeader, TooltipModule, LogoComponent, RouterLink],
  template: `
    <eligo-ui-header>
      <div start class="flex items-center gap-3 select-none cursor-pointer" routerLink="/">
         <app-logo size="medium" />
      </div>

      <div end class="flex items-center gap-2">
        <!-- Always Visible Actions -->
        <p-splitButton
          icon="pi pi-plus"
          [label]="addButtonLabel()"
          [model]="presetItems"
          [rounded]="true"
          size="small"
          severity="primary"
          styleClass="whitespace-nowrap"
          buttonStyleClass="whitespace-nowrap"
          appendTo="body"
          (onClick)="addBoxClicked.emit(undefined)"
        />

        <!-- Mobile Price Display -->
        <div class="flex flex-col items-end mr-2 md:hidden">
          <span class="text-[9px] text-surface-500 uppercase tracking-widest font-bold">Suma</span>
          <span class="text-sm font-bold text-surface-900 leading-none">{{ (price()) | number: '1.2-2' }} <span class="text-[10px]">PLN</span></span>
        </div>

        <!-- Desktop Buttons Wrapper -->
        <div class="hidden md:flex items-center gap-2">
           <p-button
            icon="pi pi-refresh"
            label="Zacznij od nowa"
            [text]="true"
            severity="danger"
            pTooltip="Zresetuj konfigurację"
            tooltipPosition="bottom"
            (onClick)="startOverClicked.emit()"
          />
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
              icon="pi pi-refresh"
              label="Zacznij od nowa"
              [text]="true"
              severity="danger"
              styleClass="w-full !justify-start !text-left px-4"
              (onClick)="startOverClicked.emit(); menuVisible.set(false)"
            />
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
  private readonly breakpointObserver = inject(BreakpointObserver);

  price = input.required<number>();

  addBoxClicked = output<BoxPreset | undefined>();

  helpClicked = output<void>();
  restoreClicked = output<void>();
  startOverClicked = output<void>();

  menuVisible = signal(false);

  // Responsive label for the add button
  private readonly isSmallScreen = toSignal(
    this.breakpointObserver.observe('(max-width: 768px)').pipe(map(result => result.matches)),
    { initialValue: false }
  );

  addButtonLabel = computed(() => this.isSmallScreen() ? 'Dodaj' : 'Dodaj pudełko');

  // Map presets to PrimeNG MenuItems
  readonly presetItems: MenuItem[] = BOX_PRESETS.map(preset => ({
    label: `${preset.label} (${preset.width}x${preset.depth})`,
    command: () => {
      this.addBoxClicked.emit(preset);
    }
  }));
}
