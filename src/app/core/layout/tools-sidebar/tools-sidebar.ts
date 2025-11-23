import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SidebarSection } from '../../../shared/ui/sidebar-section/sidebar-section';
import { UiSidebar } from '../../../shared/ui/ui-sidebar/ui-sidebar';

@Component({
  selector: 'eligo-tools-sidebar',
  imports: [CommonModule, ButtonModule, TooltipModule, SidebarSection, UiSidebar],
  template: `
    <eligo-ui-sidebar>
      <!-- Header Slot -->
      <div header class="flex flex-col gap-2 p-2 border-b border-gray-200">
        <p-button 
          label="Dodaj Pudełko"
          icon="pi pi-plus" 
          [outlined]="true" 
          severity="secondary" 
          styleClass="w-full !justify-start gap-2" 
          (onClick)="addBox.emit()" />
          
        <p-button 
          label="Edytuj Szufladę"
          icon="pi pi-pencil" 
          [outlined]="true" 
          severity="secondary" 
          styleClass="w-full !justify-start gap-2" 
          (onClick)="editDrawer.emit()" />
      </div>

      <!-- Main Content -->
      <eligo-sidebar-section title="Elementy">
        <div class="flex flex-col gap-1">
          @for (item of items(); track item.id) {
            <button 
              class="flex items-center gap-3 p-2 rounded hover:bg-gray-100 transition-colors text-left group w-full"
              [class.bg-blue-50]="selectedId() === item.id"
              (click)="selectItem.emit(item.id)">
              <i class="pi pi-box text-gray-400 group-hover:text-blue-500"></i>
              <span class="text-sm truncate text-gray-700">{{ item.name }}</span>
            </button>
          }
        </div>
      </eligo-sidebar-section>
    </eligo-ui-sidebar>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolsSidebar {
  items = input.required<{ id: number; name: string }[]>();
  selectedId = input<number | null>(null);
  
  addBox = output<void>();
  editDrawer = output<void>();
  selectItem = output<number>();
}
