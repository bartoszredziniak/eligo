import { Component, ChangeDetectionStrategy, output, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ScrollableContainerComponent } from '../../../../shared/components/scrollable-container/scrollable-container.component';

@Component({
  selector: 'eligo-canvas-toolbar',
  imports: [ButtonModule, ScrollableContainerComponent],
  template: `
    <div class="bg-linear-to-b from-white/90 to-transparent pb-6 pt-2 pointer-events-auto">
      <eligo-scrollable-container>
          <div class="flex gap-1 mx-auto w-fit">
            <p-button
              label="Dodaj pudełko"
              icon="pi pi-plus"
              [rounded]="true"
              size="small"
              severity="primary"
              styleClass="whitespace-nowrap"
              (onClick)="addBoxClicked.emit()"
            />

            <p-button
              [icon]="showLabels() ? 'pi pi-eye' : 'pi pi-eye-slash'"
              [label]="showLabels() ? 'Ukryj etykiety' : 'Pokaż etykiety'"
              severity="secondary"
              [rounded]="true"
              size="small"
              styleClass="whitespace-nowrap"
              (onClick)="toggleLabelsClicked.emit()"
            />
            <p-button
              label="Sterowanie"
              icon="pi pi-question-circle"
              [rounded]="true"
              size="small"
              severity="secondary"
              styleClass="whitespace-nowrap"
              (onClick)="helpClicked.emit()"
            />
          </div>
      </eligo-scrollable-container>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasToolbar {
  showLabels = input<boolean>(true);

  addBoxClicked = output<void>();
  toggleLabelsClicked = output<void>();
  helpClicked = output<void>();
}
