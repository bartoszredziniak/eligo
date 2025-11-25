import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SidebarSection } from '../../../../shared/ui/sidebar-section/sidebar-section';
import { DrawerConfig } from '../../../models/drawer.models';

@Component({
  selector: 'eligo-drawer-properties-form',
  imports: [CommonModule, FormsModule, InputNumberModule, SidebarSection],
  template: `
    <eligo-sidebar-section title="Ustawienia Szuflady">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label for="drawer-width" class="text-sm text-gray-600">Szerokość (mm)</label>
          <p-inputNumber
            inputId="drawer-width"
            [ngModel]="config().width"
            (ngModelChange)="widthChange.emit($event ?? 0)"
            suffix=" mm"
            styleClass="w-full"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label for="drawer-depth" class="text-sm text-gray-600">Głębokość (mm)</label>
          <p-inputNumber
            inputId="drawer-depth"
            [ngModel]="config().depth"
            (ngModelChange)="depthChange.emit($event ?? 0)"
            suffix=" mm"
            styleClass="w-full"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label for="drawer-height" class="text-sm text-gray-600">Wysokość (mm)</label>
          <p-inputNumber
            inputId="drawer-height"
            [ngModel]="config().height"
            (ngModelChange)="heightChange.emit($event ?? 0)"
            suffix=" mm"
            styleClass="w-full"
            class="w-full"
          />
        </div>
      </div>
    </eligo-sidebar-section>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerPropertiesForm {
  config = input.required<DrawerConfig>();

  widthChange = output<number>();
  depthChange = output<number>();
  heightChange = output<number>();
}
