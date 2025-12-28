import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MmInput } from '../../../../shared/form-controls/mm-input/mm-input';
import { DrawerService } from '../../../../core/services/drawer.service';
import { DRAWER_CONSTRAINTS } from '../../../../core/config/app-config';


@Component({
  selector: 'app-welcome-dimensions',
  standalone: true,
  imports: [ButtonModule, MmInput],
  template: `
    <div class="flex flex-col gap-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Wymiary szuflady</h2>
        <p class="text-gray-600">
          Zmierz płaską część dna szuflady (wnętrze).
        </p>
      </div>

      <div class="bg-blue-50 p-4 rounded-lg flex gap-3 items-start text-sm text-blue-800">
        <i class="pi pi-info-circle mt-1 text-blue-600"></i>
        <div>
          <p class="font-medium">Jak mierzyć?</p>
          <p>Szuflady często mają pochylone ścianki. Mierz dno w najwęższym miejscu, aby organizery idealnie pasowały.</p>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <eligo-mm-input
          inputId="drawer-width"
          label="Szerokość"
          [value]="config().width"
          (valueChange)="updateWidth($event)"
          [min]="constraints.width.min"
          [max]="constraints.width.max"
        />

        <eligo-mm-input
          inputId="drawer-depth"
          label="Głębokość"
          [value]="config().depth"
          (valueChange)="updateDepth($event)"
          [min]="constraints.depth.min"
          [max]="constraints.depth.max"
        />

        <eligo-mm-input
          inputId="drawer-height"
          label="Wysokość"
          [value]="config().height"
          (valueChange)="updateHeight($event)"
          [min]="constraints.height.min"
          [max]="constraints.height.max"
        />
      </div>

      <div class="flex gap-3 mt-4">
        <p-button 
          label="Wróć" 
          styleClass="p-button-text w-full" 
          (onClick)="back()">
        </p-button>
        <p-button 
          label="Dalej" 
          icon="pi pi-arrow-right" 
          iconPos="right"
          styleClass="w-full"
          (onClick)="next()">
        </p-button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeDimensionsComponent {
  private router = inject(Router);
  private drawerService = inject(DrawerService);
  protected readonly constraints = DRAWER_CONSTRAINTS;

  config = this.drawerService.drawerConfig;

  updateWidth(value: number) {
    this.drawerService.updateDrawerConfig({ width: value });
  }

  updateDepth(value: number) {
    this.drawerService.updateDrawerConfig({ depth: value });
  }

  updateHeight(value: number) {
    this.drawerService.updateDrawerConfig({ height: value });
  }

  back() {
    this.router.navigate(['/']);
  }

  next() {
    this.router.navigate(['templates'], { relativeTo: this.router.routerState.root.firstChild });
  }
}
