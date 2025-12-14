import { Component, ChangeDetectionStrategy, inject, ViewChild, Injector, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { UiLayout, MobileTab } from '../../../../shared/ui/ui-layout/ui-layout';
import { Header } from '../../../../core/layout/header/header';
import { ToolsSidebar } from '../../../../core/layout/tools-sidebar/tools-sidebar';
import { SummaryBar } from '../../../../core/layout/summary-bar/summary-bar';
import { CanvasStage } from '../../components/canvas-stage/canvas-stage';
import { DrawerService } from '../../../../core/services/drawer.service';
import { ConfiguratorStateService } from '../../../../core/services/configurator-state.service';
import { PdfGeneratorService } from '../../../../core/services/pdf-generator.service';
import { HelpDialogComponent } from '../../components/help-dialog/help-dialog.component';
import { RestoreConfigDialogComponent } from '../../components/restore-config-dialog/restore-config-dialog.component';
import { MobileBottomNav } from '../../../../shared/ui/mobile-bottom-nav/mobile-bottom-nav';
import { MobileSummaryBar } from '../../../../core/layout/mobile-summary-bar/mobile-summary-bar';

@Component({
  selector: 'eligo-configurator-page',
  imports: [
    CommonModule,
    TooltipModule,
    UiLayout,
    Header,
    ToolsSidebar,
    SummaryBar,
    CanvasStage,
    HelpDialogComponent,
    RestoreConfigDialogComponent,
    MobileBottomNav,
    MobileSummaryBar,
  ],
  template: `
    <eligo-ui-layout [activeTab]="activeMobileTab()">
      <!-- Header -->
      <eligo-header
        header
        (helpClicked)="helpVisible.set(true)"
        (restoreClicked)="restoreVisible.set(true)"
      />

      <!-- Left Sidebar -->
      <eligo-tools-sidebar sidebarLeft />

      <!-- Main Content (3D Canvas) -->
      <eligo-canvas-stage #canvasStage />

      <!-- Desktop Footer -->
      <eligo-summary-bar
        footer
        [price]="drawerService.totalPrice()"
        [weight]="drawerService.totalWeight()"
        [configCode]="drawerService.configCode()"
        (generateOrder)="onGenerateOrder()"
      />

      <!-- Mobile Footer (compact) -->
      <eligo-mobile-summary-bar
        mobileFooter
        [price]="drawerService.totalPrice()"
        [weight]="drawerService.totalWeight()"
        (generateOrder)="onGenerateOrder()"
      />

      <!-- Mobile Bottom Navigation -->
      <eligo-mobile-bottom-nav
        bottomNav
        [activeTab]="activeMobileTab()"
        (tabChange)="onMobileTabChange($event)"
      />
    </eligo-ui-layout>

    <eligo-help-dialog [(visible)]="helpVisible" />
    <eligo-restore-config-dialog [(visible)]="restoreVisible" />
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguratorPage {
  @ViewChild('canvasStage') canvasStage!: CanvasStage;

  protected readonly drawerService = inject(DrawerService);
  protected readonly stateService = inject(ConfiguratorStateService);
  private readonly injector = inject(Injector);

  protected readonly helpVisible = signal(false);
  protected readonly restoreVisible = signal(false);

  // Mobile state
  protected readonly activeMobileTab = signal<MobileTab>('canvas');

  onMobileTabChange(tab: MobileTab) {
    this.activeMobileTab.set(tab);
  }

  async onGenerateOrder(): Promise<void> {
    if (!this.canvasStage) {
      console.error('Canvas stage not available');
      return;
    }

    const pdfGenerator = this.injector.get(PdfGeneratorService);
    const drawerImage = this.canvasStage.captureScene();

    await pdfGenerator.generateOrderPdf(
      this.drawerService.drawerConfig(),
      this.drawerService.boxes(),
      drawerImage,
      this.drawerService.generateConfigCode()
    );
  }
}
