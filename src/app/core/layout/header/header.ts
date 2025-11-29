import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { UiHeader } from '../../../shared/ui/ui-header/ui-header';

@Component({
  selector: 'eligo-header',
  imports: [NgOptimizedImage, ButtonModule, UiHeader],
  template: `
    <eligo-ui-header>
      <div start class="flex items-center gap-2">
        <img ngSrc="/eligo-logo.svg" alt="Eligo" width="120" height="24" priority />
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
