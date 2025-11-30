import { Component, ChangeDetectionStrategy, model, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { DrawerService } from '../../../../core/services/drawer.service';

@Component({
  selector: 'eligo-restore-config-dialog',
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, TextareaModule, MessageModule],
  template: `
    <p-dialog 
      header="Wczytaj Konfigurację" 
      [(visible)]="visible" 
      [modal]="true" 
      [style]="{ width: '40vw' }" 
      [draggable]="false" 
      [resizable]="false"
    >
      <div class="flex flex-col gap-4">
        <p class="text-gray-700">
          Wklej poniżej kod konfiguracji, aby przywrócić zap saved projekt.
          Uwaga: Obecna konfiguracja zostanie nadpisana.
        </p>

        <textarea 
          pInputTextarea 
          [(ngModel)]="configCode" 
          rows="5" 
          class="w-full font-mono text-sm"
          placeholder="Wklej kod tutaj..."
        ></textarea>

        @if (error()) {
          <p-message severity="error" text="Nieprawidłowy kod konfiguracji" variant="simple" />
        }
      </div>
      
      <ng-template pTemplate="footer">
        <p-button label="Anuluj" (onClick)="close()" [text]="true" severity="secondary" />
        <p-button label="Wczytaj" (onClick)="restore()" [disabled]="!configCode()" />
      </ng-template>
    </p-dialog>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestoreConfigDialogComponent {
  private drawerService = inject(DrawerService);
  
  visible = model<boolean>(false);
  configCode = signal('');
  error = signal(false);

  restore() {
    this.error.set(false);
    const success = this.drawerService.restoreFromConfigCode(this.configCode());
    
    if (success) {
      this.close();
    } else {
      this.error.set(true);
    }
  }

  close() {
    this.visible.set(false);
    this.configCode.set('');
    this.error.set(false);
  }
}
