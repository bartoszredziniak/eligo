import { Component, ChangeDetectionStrategy, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'eligo-canvas-controls-help',
  imports: [DialogModule, ButtonModule],
  template: `
    <p-dialog
      header="Sterowanie 3D"
      [(visible)]="visible"
      [modal]="true"
      [dismissableMask]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '90vw', maxWidth: '400px' }"
      appendTo="body"
    >
      <div class="flex flex-col gap-4">
        <!-- Desktop / Mouse Section -->
        <div>
          <h5 class="m-0 mb-3 text-surface-500 font-semibold text-xs uppercase tracking-wider">Mysz (Desktop)</h5>
          <ul class="list-none p-0 m-0 text-sm space-y-3">
            <li class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary shrink-0">
                <i class="pi pi-arrows-alt"></i>
              </div>
              <div>
                <div class="font-medium text-surface-900">Przesuwanie widoku</div>
                <div class="text-surface-500 text-xs">Lewy lub prawy przycisk myszy</div>
              </div>
            </li>
            <li class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary shrink-0">
                <i class="pi pi-search-plus"></i>
              </div>
              <div>
                <div class="font-medium text-surface-900">Przybliżanie / Oddalanie</div>
                <div class="text-surface-500 text-xs">Rolka myszy</div>
              </div>
            </li>
          </ul>
        </div>

        <div class="h-px bg-surface-200"></div>

        <!-- Mobile / Touch Section -->
        <div>
          <h5 class="m-0 mb-3 text-surface-500 font-semibold text-xs uppercase tracking-wider">Dotyk (Mobile)</h5>
          <ul class="list-none p-0 m-0 text-sm space-y-3">
             <li class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary shrink-0">
                <i class="pi pi-arrows-alt"></i>
              </div>
              <div>
                <div class="font-medium text-surface-900">Przesuwanie widoku</div>
                <div class="text-surface-500 text-xs">Przeciągnij jednym palcem</div>
              </div>
            </li>
            <li class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary shrink-0">
                 <i class="pi pi-search-plus"></i>
              </div>
              <div>
                <div class="font-medium text-surface-900">Przybliżanie / Oddalanie</div>
                <div class="text-surface-500 text-xs">Dwa palce (uszczypnij) lub przyciski +/-</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Rozumiem" (onClick)="visible.set(false)" [text]="true" />
      </ng-template>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasControlsHelp {
  visible = model(false);
}
