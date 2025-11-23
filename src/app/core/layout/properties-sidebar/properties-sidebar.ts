import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { SidebarSection } from '../../../shared/ui/sidebar-section/sidebar-section';
import { UiSidebar } from '../../../shared/ui/ui-sidebar/ui-sidebar';

@Component({
  selector: 'eligo-properties-sidebar',
  imports: [CommonModule, InputTextModule, InputNumberModule, FormsModule, SidebarSection, UiSidebar],
  template: `
    <eligo-ui-sidebar>
      <eligo-sidebar-section title="Właściwości">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">Szerokość (mm)</label>
            <p-inputNumber 
              [ngModel]="drawerWidth()" 
              (ngModelChange)="drawerWidthChange.emit($event)"
              suffix=" mm" 
              styleClass="w-full" 
              class="w-full" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">Głębokość (mm)</label>
            <p-inputNumber 
              [ngModel]="drawerDepth()" 
              (ngModelChange)="drawerDepthChange.emit($event)"
              suffix=" mm" 
              styleClass="w-full" 
              class="w-full" />
          </div>
        </div>
      </eligo-sidebar-section>
    </eligo-ui-sidebar>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertiesSidebar {
  drawerWidth = input.required<number>();
  drawerDepth = input.required<number>();
  
  drawerWidthChange = output<number>();
  drawerDepthChange = output<number>();
}
