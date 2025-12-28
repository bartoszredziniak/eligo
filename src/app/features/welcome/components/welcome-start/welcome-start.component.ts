import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DrawerService } from '../../../../core/services/drawer.service';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-welcome-start',
  standalone: true,
  imports: [ButtonModule, InputTextModule, FormsModule, MessageModule],
  template: `
    <div class="text-center">
      <h1 class="text-3xl font-extrabold text-gray-900 mb-4">Witaj w Eligo</h1>
      <p class="text-gray-600 mb-8 max-w-md mx-auto">
        Twoje narzędzie do organizacji szuflad. Zaprojektuj idealny porządek w kilku prostych krokach.
      </p>

      <div class="flex flex-col gap-4 max-w-xs mx-auto">
        <p-button 
          label="Zacznij od nowa" 
          icon="pi pi-plus" 
          styleClass="w-full p-button-lg"
          (onClick)="startNew()">
        </p-button>

        <div class="relative flex py-2 items-center">
          <div class="grow border-t border-gray-300"></div>
          <span class="shrink-0 mx-4 text-gray-400 text-sm">LUB</span>
          <div class="grow border-t border-gray-300"></div>
        </div>

        <div class="flex flex-col gap-2">
          <input 
            pInputText 
            placeholder="Wklej kod konfiguracji..." 
            [(ngModel)]="configCode" 
            class="w-full text-center"
            [class.ng-invalid]="hasError()" 
            [class.ng-dirty]="hasError()"
            (input)="error.set(null)"
          />
          @if (hasError()) {
            <small class="text-red-500 block">{{ error() }}</small>
          }
          <p-button 
            label="Wczytaj projekt" 
            icon="pi pi-download" 
            styleClass="w-full p-button-outlined"
            [disabled]="!configCode()"
            (onClick)="loadConfig()">
          </p-button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeStartComponent {
  private router = inject(Router);
  private drawerService = inject(DrawerService);
  
  configCode = signal('');
  error = signal<string | null>(null);
  hasError = signal(false);

  startNew() {
    this.router.navigate(['dimensions'], { relativeTo: this.router.routerState.root.firstChild });
  }

  loadConfig() {
    const code = this.configCode();
    if (!code) return;

    const success = this.drawerService.restoreFromConfigCode(code);
    
    if (success) {
      this.hasError.set(false);
      this.router.navigate(['configurator']);
    } else {
      this.error.set('Nieprawidłowy kod konfiguracji');
      this.hasError.set(true);
    }
  }
}
