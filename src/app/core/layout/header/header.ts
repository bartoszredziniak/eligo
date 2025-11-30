import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { UiHeader } from '../../../shared/ui/ui-header/ui-header';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'eligo-header',
  imports: [NgOptimizedImage, ButtonModule, UiHeader, TooltipModule],
  template: `
    <eligo-ui-header>
      <div start class="flex items-center gap-2">
        <img ngSrc="/eligo-logo.svg" alt="Eligo" width="120" height="24" priority />
      </div>

      <div end class="flex items-center gap-2">
        <p-button
          icon="pi pi-history"
          label="Przywróć"
          [text]="true"
          severity="secondary"
          pTooltip="Wczytaj konfigurację z kodu"
          tooltipPosition="bottom"
          (onClick)="restoreClicked.emit()"
        />
        <p-button
          icon="pi pi-question-circle"
          [text]="true"
          severity="secondary"
          ariaLabel="Help"
          (onClick)="helpClicked.emit()"
        />
      </div>
    </eligo-ui-header>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  helpClicked = output<void>();
  restoreClicked = output<void>();
}
