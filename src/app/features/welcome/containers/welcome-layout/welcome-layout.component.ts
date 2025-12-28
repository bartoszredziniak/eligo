import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LogoComponent } from '../../../../shared/components/logo/logo.component';
import { APP_CONFIG } from '../../../../core/config/app-config';

@Component({
  selector: 'app-welcome-layout',
  standalone: true,
  imports: [RouterOutlet, LogoComponent],
  template: `
    <div class="h-screen bg-gray-50 flex flex-col pt-6 sm:pt-12 sm:px-6 lg:px-8 overflow-y-auto">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex items-center justify-center mb-6">
            <app-logo size="large" />
        </div>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <router-outlet />
        </div>
      </div>
      <!-- Footer -->
      <footer class="mt-auto py-6 text-center text-sm text-gray-500">
        <a [href]="shopLink" target="_blank" class="hover:text-primary-600 transition-colors">
          Przejdź do sklepu (Allegro)
        </a>
      </footer>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeLayoutComponent {
  protected readonly shopLink = APP_CONFIG.shopLink;
}
