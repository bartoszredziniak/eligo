import { Component, ChangeDetectionStrategy, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'eligo-canvas-controls-help',
  imports: [DialogModule, ButtonModule],
  template: `
    <p-dialog
      header="Pomoc i Sterowanie"
      [(visible)]="visible"
      [modal]="true"
      [dismissableMask]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '90vw', maxWidth: '500px' }"
      appendTo="body"
    >
      <div class="flex flex-col gap-5">
        
        <!-- Interaction Section -->
        <div>
          <h5 class="m-0 mb-3 text-surface-500 font-semibold text-xs uppercase tracking-wider">Interakcja z pudełkami</h5>
          <ul class="list-none p-0 m-0 text-sm space-y-3">
            <li class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <i class="pi pi-plus"></i>
              </div>
              <div>
                <div class="font-medium text-surface-900">Dodawanie</div>
                <div class="text-surface-500 text-xs">Kliknij przycisk "Dodaj pudełko" w górnym pasku, aby dodać nowy element.</div>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <i class="pi pi-arrows-alt"></i>
              </div>
              <div>
                <div class="font-medium text-surface-900">Przesuwanie</div>
                <div class="text-surface-500 text-xs">Najpierw zaznacz element, a następnie kliknij/dotknij i przeciągnij go, aby zmienić położenie.</div>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <i class="pi pi-expand"></i>
              </div>
              <div>
                <div class="font-medium text-surface-900">Zmiana rozmiaru</div>
                <div class="text-surface-500 text-xs">Przeciągaj niebieskie punkty na krawędziach aktywnego elementu, aby zmienić jego wymiary.</div>
              </div>
            </li>
             <li class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <i class="pi pi-cog"></i>
              </div>
              <div>
                <div class="font-medium text-surface-900">Opcje</div>
                <div class="text-surface-500 text-xs">Zaznacz pudełko, aby je obrócić, zduplikować, zmienić kolor lub usunąć.</div>
              </div>
            </li>
          </ul>
        </div>

        <div class="h-px bg-surface-200"></div>

        <!-- Menu Section -->
        <div>
          <h5 class="m-0 mb-3 text-surface-500 font-semibold text-xs uppercase tracking-wider">Menu dolne</h5>
          <div class="text-sm text-surface-600">
            Na dole ekranu znajduje się interaktywne menu:
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li><strong>Gdy nic nie jest zaznaczone:</strong> Widoczne są ogólne ustawienia konfiguracji i opcje.</li>
              <li><strong>Po zaznaczeniu elementu:</strong> Menu zmienia się i wyświetla opcje dla wybranego elementu.</li>
            </ul>
          </div>
        </div>

        <div class="h-px bg-surface-200"></div>

        <!-- Navigation Section -->
        <div>
          <h5 class="m-0 mb-3 text-surface-500 font-semibold text-xs uppercase tracking-wider">Nawigacja w 3D</h5>
          <div class="grid grid-cols-2 gap-4">
            <!-- Mouse -->
            <div>
              <div class="text-xs font-bold text-surface-900 mb-2">Mysz (Desktop)</div>
              <ul class="list-none p-0 m-0 text-xs space-y-2 text-surface-600">
                <li><strong class="text-surface-900">Przesuwanie widoku:</strong> Przycisk myszy + ruch</li>
                <li><strong class="text-surface-900">Zoom:</strong> Rolka myszy</li>
              </ul>
            </div>
            <!-- Touch -->
            <div>
               <div class="text-xs font-bold text-surface-900 mb-2">Dotyk (Mobile)</div>
               <ul class="list-none p-0 m-0 text-xs space-y-2 text-surface-600">
                <li><strong class="text-surface-900">Przesuwanie widoku:</strong> Ruch palcem</li>
                <li><strong class="text-surface-900">Zoom:</strong> Uszczypnięcie (Pinch)</li>
              </ul>
            </div>
          </div>
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
