import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SidebarSection } from '../../../../shared/ui/sidebar-section/sidebar-section';
import { Box, BOX_COLORS, BoxColor } from '../../../models/drawer.models';

@Component({
  selector: 'eligo-box-properties-form',
  imports: [CommonModule, FormsModule, InputNumberModule, ButtonModule, SidebarSection],
  template: `
    <eligo-sidebar-section title="Edycja Pudełka">
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-2">
          <div class="flex flex-col gap-1">
            <label for="box-x" class="text-sm text-gray-600">Pozycja X (mm)</label>
            <p-inputNumber
              inputId="box-x"
              [ngModel]="box().x"
              (ngModelChange)="xChange.emit($event ?? 0)"
              suffix=" mm"
              styleClass="w-full"
              class="w-full"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label for="box-y" class="text-sm text-gray-600">Pozycja Y (mm)</label>
            <p-inputNumber
              inputId="box-y"
              [ngModel]="box().y"
              (ngModelChange)="yChange.emit($event ?? 0)"
              suffix=" mm"
              styleClass="w-full"
              class="w-full"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label for="box-width" class="text-sm text-gray-600">Szerokość (mm)</label>
          <p-inputNumber
            inputId="box-width"
            [ngModel]="box().width"
            (ngModelChange)="widthChange.emit($event ?? 0)"
            suffix=" mm"
            styleClass="w-full"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label for="box-depth" class="text-sm text-gray-600">Głębokość (mm)</label>
          <p-inputNumber
            inputId="box-depth"
            [ngModel]="box().depth"
            (ngModelChange)="depthChange.emit($event ?? 0)"
            suffix=" mm"
            styleClass="w-full"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label for="box-height" class="text-sm text-gray-600">Wysokość (mm)</label>
          <p-inputNumber
            inputId="box-height"
            [ngModel]="box().height"
            (ngModelChange)="heightChange.emit($event ?? 0)"
            suffix=" mm"
            styleClass="w-full"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label for="box-color" class="text-sm text-gray-600">Kolor</label>
          <select
            id="box-color"
            [ngModel]="box().color"
            (ngModelChange)="colorChange.emit($event)"
            class="w-full p-2 border rounded"
          >
            @for (color of availableColors; track color.value) {
              <option [value]="color.value">{{ color.label }}</option>
            }
          </select>
        </div>

        <p-button
          label="Usuń Pudełko"
          severity="danger"
          (onClick)="deleteBox.emit()"
          styleClass="w-full"
        />
      </div>
    </eligo-sidebar-section>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxPropertiesForm {
  box = input.required<Box>();

  readonly availableColors = BOX_COLORS;

  xChange = output<number>();
  yChange = output<number>();
  widthChange = output<number>();
  depthChange = output<number>();
  heightChange = output<number>();
  colorChange = output<BoxColor>();
  deleteBox = output<void>();
}
