import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { BoxValidationError } from '../../../../core/models/validation.models';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { BadgeModule } from 'primeng/badge';
import { SidebarSection } from '../../../../shared/ui/sidebar-section/sidebar-section';
import { EmptyState } from '../../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'eligo-validation-errors-panel',
  imports: [CommonModule, SidebarSection, MessageModule, BadgeModule, EmptyState],
  template: `
    <eligo-sidebar-section [defaultExpanded]="true">
      <span header class="flex items-center gap-2">
        <span>Walidacja</span>
        @if (totalCount() > 0) {
          <p-badge [value]="totalCount().toString()" severity="danger" />
        }
      </span>
      <div class="flex flex-col gap-2">
        @if (totalCount() > 0) {
          
          @if (collisionCount() > 0) {
            <p-message severity="error" variant="outlined" class="w-full">
              <div class="flex flex-col gap-1 w-full">
                <div class="font-bold">Wykryto kolizje</div>
                <div class="text-sm">
                  Liczba elementów nachodzących na siebie: {{ collisionCount() }}. Przesuń je, aby naprawić błędy.
                </div>
              </div>
            </p-message>
          }

          @if (boundaryCount() > 0) {
            <p-message severity="warn" variant="outlined" class="w-full">
              <div class="flex flex-col gap-1 w-full">
                <div class="font-bold">Elementy poza szufladą</div>
                <div class="text-sm">
                  Liczba elementów wystających: {{ boundaryCount() }}. Kliknij w czerwone pudełko aby automatycznie je przesunąć.
                </div>
              </div>
            </p-message>
          }

          @if (oversizedCount() > 0) {
            <p-message severity="error" variant="outlined" class="w-full">
              <div class="flex flex-col gap-1 w-full">
                <div class="font-bold">Elementy za duże</div>
                <div class="text-sm">
                  Liczba elementów większych niż szuflada: {{ oversizedCount() }}. Zmniejsz ich rozmiar aby pasowały.
                </div>
              </div>
            </p-message>
          }

        } @else {
          <eligo-empty-state
            [mini]="true"
            icon="pi-check-circle"
            header="Brak błędów"
            description="Wszystko skonfigurowane poprawnie"
          />
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
  errors = input.required<BoxValidationError[]>();

  collisionCount = computed(() => this.errors().filter(e => e.type === 'collision').length);
  boundaryCount = computed(() => this.errors().filter(e => e.type === 'boundary').length);
  oversizedCount = computed(() => this.errors().filter(e => e.type === 'oversized').length);
  
  totalCount = computed(() => this.errors().length);
}
