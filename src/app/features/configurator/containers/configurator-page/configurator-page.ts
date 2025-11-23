import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiLayout } from '../../../../shared/ui/ui-layout/ui-layout';
import { Header } from '../../../../core/layout/header/header';
import { ToolsSidebar } from '../../../../core/layout/tools-sidebar/tools-sidebar';
import { PropertiesSidebar } from '../../../../core/layout/properties-sidebar/properties-sidebar';
import { SummaryBar } from '../../../../core/layout/summary-bar/summary-bar';
import { CanvasStage } from '../../components/canvas-stage/canvas-stage';

@Component({
  selector: 'eligo-configurator-page',
  imports: [
    CommonModule, 
    UiLayout, 
    Header, 
    ToolsSidebar, 
    PropertiesSidebar, 
    SummaryBar, 
    CanvasStage
  ],
  template: `
    <eligo-ui-layout>
      <!-- Header -->
      <eligo-header header />

      <!-- Left Sidebar -->
      <eligo-tools-sidebar 
        sidebarLeft
        [items]="items()"
        [selectedId]="selectedId()"
        (addBox)="onAddBox()"
        (editDrawer)="onEditDrawer()"
        (selectItem)="onSelectItem($event)" />

      <!-- Right Sidebar -->
      <eligo-properties-sidebar 
        sidebarRight
        [drawerWidth]="drawerWidth()"
        [drawerDepth]="drawerDepth()"
        (drawerWidthChange)="onDrawerWidthChange($event)"
        (drawerDepthChange)="onDrawerDepthChange($event)" />

      <!-- Main Content -->
      <eligo-canvas-stage />

      <!-- Footer -->
      <eligo-summary-bar 
        footer
        [price]="price()"
        (generateOrder)="onGenerateOrder()" />
    </eligo-ui-layout>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguratorPage {
  // Application State
  items = signal([
    { id: 1, name: 'Box 100x100' },
    { id: 2, name: 'Box 100x200' },
    { id: 3, name: 'Box 200x200' }
  ]);
  selectedId = signal<number | null>(null);
  
  drawerWidth = signal(600);
  drawerDepth = signal(500);
  
  price = signal(120.00);

  // Event Handlers
  onAddBox() {
    console.log('Add Box clicked');
    // Logic to add box
  }

  onEditDrawer() {
    console.log('Edit Drawer clicked');
    // Logic to edit drawer
  }

  onSelectItem(id: number) {
    this.selectedId.set(id);
  }

  onDrawerWidthChange(width: number) {
    this.drawerWidth.set(width);
    this.updatePrice();
  }

  onDrawerDepthChange(depth: number) {
    this.drawerDepth.set(depth);
    this.updatePrice();
  }

  onGenerateOrder() {
    console.log('Generate Order clicked');
  }

  private updatePrice() {
    // Mock price calculation
    this.price.set(this.drawerWidth() * this.drawerDepth() * 0.001);
  }
}
