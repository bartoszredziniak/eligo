import { Component, ChangeDetectionStrategy, inject, ViewChild, Injector, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpeedDialModule } from 'primeng/speeddial';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MenuItem } from 'primeng/api';
import { UiLayout, MobileTab } from '../../../../shared/ui/ui-layout/ui-layout';
import { Header } from '../../../../core/layout/header/header';
import { ToolsSidebar } from '../../../../core/layout/tools-sidebar/tools-sidebar';
import { PropertiesSidebar } from '../../../../core/layout/properties-sidebar/properties-sidebar';
import { SummaryBar } from '../../../../core/layout/summary-bar/summary-bar';
import { CanvasStage } from '../../components/canvas-stage/canvas-stage';
import { DrawerService } from '../../../../core/services/drawer.service';
import { ConfiguratorStateService } from '../../../../core/services/configurator-state.service';
import { PdfGeneratorService } from '../../../../core/services/pdf-generator.service';
import { HelpDialogComponent } from '../../components/help-dialog/help-dialog.component';
import { RestoreConfigDialogComponent } from '../../components/restore-config-dialog/restore-config-dialog.component';
import { MobileBottomNav } from '../../../../shared/ui/mobile-bottom-nav/mobile-bottom-nav';
import { MobileBottomSheet } from '../../../../shared/ui/mobile-bottom-sheet/mobile-bottom-sheet';
import { MobileSummaryBar } from '../../../../core/layout/mobile-summary-bar/mobile-summary-bar';

@Component({
  selector: 'eligo-configurator-page',
  imports: [
    CommonModule,
    SpeedDialModule,
    TooltipModule,
    DialogModule,
    UiLayout,
    Header,
    ToolsSidebar,
    PropertiesSidebar,
    SummaryBar,
    CanvasStage,
    HelpDialogComponent,
    RestoreConfigDialogComponent,
    MobileBottomNav,
    MobileBottomSheet,
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

      <!-- Right Sidebar -->
      <eligo-properties-sidebar sidebarRight />

      <!-- Main Content (3D Canvas) -->
      <eligo-canvas-stage #canvasStage />

      <!-- SpeedDial FAB for mobile (Add Box + toolbar actions) -->
      <p-speeddial
        fab
        [model]="speedDialItems"
        direction="up"
        [showIcon]="'pi pi-plus'"
        [hideIcon]="'pi pi-times'"
        [buttonProps]="{ severity: 'primary', rounded: true }"
        [style]="{ position: 'relative' }"
        [tooltipOptions]="{ tooltipPosition: 'left' }"
      />

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

    <!-- Mobile Bottom Sheet for properties (always visible on canvas tab) -->
    <eligo-mobile-bottom-sheet
      [visible]="bottomSheetVisible()"
      [title]="bottomSheetTitle()"
    >
      <eligo-properties-sidebar />
    </eligo-mobile-bottom-sheet>

    <!-- Mobile 3D Controls Help Dialog -->
    <p-dialog
      header="Sterowanie 3D"
      [(visible)]="controls3dHelpVisible"
      [modal]="true"
      [style]="{ width: '90vw', maxWidth: '320px' }"
      [draggable]="false"
      [resizable]="false"
    >
      <ul class="list-none p-0 m-0 text-sm space-y-4">
        <li class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <i class="pi pi-sync text-lg"></i>
          </div>
          <div>
            <div class="font-semibold text-gray-900">Obracanie</div>
            <div class="text-gray-500 text-xs">Jeden palec / Lewy przycisk myszy</div>
          </div>
        </li>
        <li class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <i class="pi pi-arrows-alt text-lg"></i>
          </div>
          <div>
            <div class="font-semibold text-gray-900">Przesuwanie</div>
            <div class="text-gray-500 text-xs">Dwa palce / Prawy przycisk myszy</div>
          </div>
        </li>
        <li class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
            <i class="pi pi-search-plus text-lg"></i>
          </div>
          <div>
            <div class="font-semibold text-gray-900">Przybliżanie</div>
            <div class="text-gray-500 text-xs">Ściągnij palce / Rolka myszy</div>
          </div>
        </li>
      </ul>
    </p-dialog>

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
  protected controls3dHelpVisible = false;
  
  // Mobile state
  protected readonly activeMobileTab = signal<MobileTab>('canvas');
  
  // Bottom sheet is always visible on canvas tab (on mobile)
  protected readonly bottomSheetVisible = computed(() => {
    return this.activeMobileTab() === 'canvas';
  });
  
  // Bottom sheet title based on view mode
  protected readonly bottomSheetTitle = computed(() => {
    const selectedId = this.stateService.selectedBoxId();
    if (selectedId) {
      return 'Ustawienia pudełka';
    }
    return 'Ustawienia szuflady';
  });
  
  // SpeedDial menu items for mobile FAB
  protected speedDialItems: MenuItem[] = [
    {
      label: 'Dodaj Pudełko',
      icon: 'pi pi-plus',
      command: () => this.addBoxMobile()
    },
    {
      label: 'Resetuj widok',
      icon: 'pi pi-refresh',
      command: () => this.canvasStage?.resetView()
    },
    {
      label: 'Pokaż/ukryj etykiety',
      icon: 'pi pi-eye',
      command: () => this.canvasStage?.toggleLabels()
    },
    {
      label: 'Sterowanie 3D',
      icon: 'pi pi-question-circle',
      command: () => this.controls3dHelpVisible = true
    }
  ];

  onMobileTabChange(tab: MobileTab) {
    this.activeMobileTab.set(tab);
  }

  addBoxMobile() {
    this.stateService.startAddingBox();

    const width = 6; // grid units
    const depth = 6; // grid units
    
    const freePosition = this.drawerService.findFirstFreePosition(width, depth);
    const { x, y } = freePosition || { x: 0, y: 0 };

    this.drawerService.addBox({
      width,
      depth,
      height: 50,
      x,
      y,
      color: 'white',
      name: 'Pudełko',
    });

    this.stateService.finishAddingBox();
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
