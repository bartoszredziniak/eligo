import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { BadgeModule } from 'primeng/badge';
import { SidebarSection } from '../../../../shared/ui/sidebar-section/sidebar-section';

@Component({
  selector: 'eligo-validation-errors-panel',
  imports: [CommonModule, SidebarSection, MessageModule, BadgeModule],
  template: `
    <eligo-sidebar-section [defaultExpanded]="true" [hasHeaderContent]="true">
      <span header class="flex items-center gap-2">
        <span>Walidacja</span>
        @if (count() > 0) {
          <p-badge [value]="count().toString()" severity="danger" />
        }
      </span>
      <div class="flex flex-col gap-2">
        @if (count() > 0) {
          <p-message severity="error" variant="outlined" class="w-full">
            <div class="flex flex-col gap-1 w-full">
              <div class="font-bold">Wykryto kolizje</div>
              <div class="text-sm">
                Liczba elementów nachodzących na siebie: {{ count() }}. Przesuń je, aby naprawić błędy.
              </div>
            </div>
          </p-message>
        } @else {
          <p-message severity="success" variant="outlined" class="w-full">
            <div class="flex items-center gap-2">
              <span class="text-sm">Wszystkie elementy są rozmieszczone poprawnie.</span>
            </div>
          </p-message>
        }
      </div>
    </eligo-sidebar-section>
  `,
  styles: [
    `
      :host ::ng-deep .p-message {
        width: 100%;
        justify-content: flex-start;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationErrorsPanel {
  count = input.required<number>();
}
