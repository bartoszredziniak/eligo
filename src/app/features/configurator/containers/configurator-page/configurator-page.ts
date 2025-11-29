import { Component, ChangeDetectionStrategy, inject, ViewChild, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiLayout } from '../../../../shared/ui/ui-layout/ui-layout';
import { Header } from '../../../../core/layout/header/header';
import { ToolsSidebar } from '../../../../core/layout/tools-sidebar/tools-sidebar';
import { PropertiesSidebar } from '../../../../core/layout/properties-sidebar/properties-sidebar';
import { SummaryBar } from '../../../../core/layout/summary-bar/summary-bar';
import { CanvasStage } from '../../components/canvas-stage/canvas-stage';
import { DrawerService } from '../../../../core/services/drawer.service';
import { ConfiguratorStateService } from '../../../../core/services/configurator-state.service';
import { PdfGeneratorService } from '../../../../core/services/pdf-generator.service';

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
      <eligo-canvas-stage #canvasStage />

      <!-- Footer -->
      <eligo-summary-bar
        footer
        [price]="drawerService.totalPrice()"
        [weight]="drawerService.totalWeight()"
        (generateOrder)="onGenerateOrder()"
      />
    </eligo-ui-layout>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguratorPage {
  @ViewChild('canvasStage') canvasStage!: CanvasStage;

  protected readonly drawerService = inject(DrawerService);
  protected readonly stateService = inject(ConfiguratorStateService);
  private readonly injector = inject(Injector);

  async onGenerateOrder(): Promise<void> {
    if (!this.canvasStage) {
      console.error('Canvas stage not available');
      return;
    }

    // Lazy load PDF generator service
    const pdfGenerator = this.injector.get(PdfGeneratorService);

    // Capture the 3D scene
    const drawerImage = this.canvasStage.captureScene();

    // Generate PDF
    await pdfGenerator.generateOrderPdf(
      this.drawerService.drawerConfig(),
      this.drawerService.boxes(),
      drawerImage
    );
  }
}
