import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiLayout } from '../../../../shared/ui/ui-layout/ui-layout';
import { Header } from '../../../../core/layout/header/header';
import { ToolsSidebar } from '../../../../core/layout/tools-sidebar/tools-sidebar';
import { PropertiesSidebar } from '../../../../core/layout/properties-sidebar/properties-sidebar';
import { SummaryBar } from '../../../../core/layout/summary-bar/summary-bar';
import { CanvasStage } from '../../components/canvas-stage/canvas-stage';
import { DrawerService } from '../../../../core/services/drawer.service';
import { ConfiguratorStateService } from '../../../../core/services/configurator-state.service';

@Component({
  selector: 'eligo-configurator-page',
  imports: [
    CommonModule,
    UiLayout,
    Header,
    ToolsSidebar,
    PropertiesSidebar,
    SummaryBar,
    CanvasStage,
  ],
  template: `
    <eligo-ui-layout>
      <!-- Header -->
      <eligo-header header />

      <!-- Left Sidebar -->
      <eligo-tools-sidebar sidebarLeft />

      <!-- Right Sidebar -->
      <eligo-properties-sidebar sidebarRight />

      <!-- Main Content -->
      <eligo-canvas-stage />

      <!-- Footer -->
      <eligo-summary-bar footer [price]="0" />
    </eligo-ui-layout>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguratorPage {
  protected readonly drawerService = inject(DrawerService);
  protected readonly stateService = inject(ConfiguratorStateService);
}
