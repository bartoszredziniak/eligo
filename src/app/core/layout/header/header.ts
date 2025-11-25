import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { UiHeader } from '../../../shared/ui/ui-header/ui-header';

@Component({
  selector: 'eligo-header',
  imports: [ButtonModule, UiHeader],
  template: `
    <eligo-ui-header>
      <div start class="flex items-center gap-2">
        <span class="font-bold text-xl tracking-tight">Eligo</span>
      </div>

      <div end>
        <p-button
          icon="pi pi-question-circle"
          [text]="true"
          severity="secondary"
          ariaLabel="Help"
        />
      </div>
    </eligo-ui-header>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {}
