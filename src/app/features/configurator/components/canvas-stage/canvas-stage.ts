import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
  PLATFORM_ID,
  signal,
  computed,
  untracked,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ThreeSceneFacade } from '../../three/three-scene.facade';
import { DrawerVisualizer } from '../../three/visualizers/drawer.visualizer';
import { BoxVisualizer } from '../../three/visualizers/box.visualizer';
import { InteractionManager } from '../../three/interaction.manager';
import { DrawerService } from '../../../../core/services/drawer.service';
import { ConfiguratorStateService } from '../../../../core/services/configurator-state.service';
import { GridService } from '../../../../core/services/grid.service';
import { ThreeFactoryService } from '../../three/services/three-factory.service';
import { DrawerConfig, BoxPreset } from '../../../../core/models/drawer.models';
import { SceneCaptureService } from '../../../../core/services/scene-capture.service';

import { BoxPropertiesForm } from '../forms/box-properties-form/box-properties-form';
import { DrawerPropertiesForm } from '../forms/drawer-properties-form/drawer-properties-form';
import { CanvasActionBar } from './canvas-action-bar.component';
import { CanvasControlsHelp } from './canvas-controls-help.component';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'eligo-canvas-stage',
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    TooltipModule,
    BoxPropertiesForm,
    DrawerPropertiesForm,
    CanvasActionBar,
    CanvasControlsHelp,
    SelectButtonModule,
    FormsModule,
  ],
  template: `
    <div class="relative w-full h-full overflow-hidden">
      <!-- Three.js Canvas Container -->
      <div
        #canvasContainer
        class="w-full h-full bg-gray-50"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp($event)"
        (pointerleave)="onPointerUp($event)"
      ></div>

      <!-- Bottom Action Bar Layer -->
      <div class="absolute bottom-4 md:bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[90vw]">
        <!-- Floating Dimensions Badge -->
        @if (selectedBoxDimensions(); as dims) {
          <div class="flex items-center justify-center gap-2 mb-2">
            <div class="flex items-center gap-2 px-3 py-1.5 bg-surface-900/80 backdrop-blur-sm rounded-full shadow-lg text-[11px] font-medium text-white">
              <span>{{ dims.width }}</span>
              <span class="text-surface-400">×</span>
              <span>{{ dims.depth }}</span>
              <span class="text-surface-400">×</span>
              <span>{{ dims.height }}</span>
              <span class="text-[9px] text-surface-400 ml-0.5">mm</span>
            </div>
          </div>
        }
        <eligo-canvas-action-bar
          [hasSelection]="!!stateService.selectedBoxId()"
          (colorClicked)="colorDialogVisible.set(true)"
          (settingsClicked)="settingsDialogVisible.set(true)"
          (duplicateClicked)="duplicateSelected()"
          (rotateClicked)="rotateSelected()"
          (removeClicked)="removeSelected()"
          (drawerSettingsClicked)="drawerDialogVisible.set(true)"
          (controlsClicked)="controlsHelpVisible.set(true)"
        />
      </div>

      <!-- Zoom Controls -->
      <div class="absolute bottom-20 md:bottom-16 right-2 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <p-button
          icon="pi pi-plus"
          [rounded]="true"
          severity="secondary"
          [raised]="true"
          size="small"
          (onClick)="zoomIn()"
          pTooltip="Przybliż"
          tooltipPosition="left"
        />
        <p-button
          icon="pi pi-minus"
          [rounded]="true"
          severity="secondary"
          [raised]="true"
          size="small"
          (onClick)="zoomOut()"
          pTooltip="Oddal"
          tooltipPosition="left"
        />
      </div>

      <!-- View Toggle -->
      <div class="absolute top-4 right-4 z-20 pointer-events-auto">
        <div class="bg-surface-0/90 backdrop-blur-sm shadow-sm rounded-md">
          <p-selectButton
            [options]="viewOptions"
            [ngModel]="is2DMode()"
            (ngModelChange)="setMode($event)"
            optionLabel="label"
            optionValue="value"
            styleClass="!border-0"
          />
        </div>
      </div>

      <!-- Feature Dialogs -->
      <eligo-canvas-controls-help [(visible)]="controlsHelpVisible" />

      <!-- Color Dialog -->
      <p-dialog
        header="Wybierz kolor"
        [(visible)]="colorDialogVisible"
        [modal]="true"
        [dismissableMask]="true"
        [draggable]="false"
        [resizable]="false"
        [breakpoints]="dialogBreakpoints"
        [style]="{ width: '50vw', maxWidth: '400px' }"
        appendTo="body"
      >
        @if (selectedBox(); as box) {
          <eligo-box-properties-form
            [box]="box"
            [drawerHeight]="drawerService.drawerConfig().height"
            [embedded]="true"
            [visibleSections]="['appearance']"
          />
        }
      </p-dialog>

      <!-- Settings Dialog -->
      <p-dialog
        header="Ustawienia pudełka"
        [(visible)]="settingsDialogVisible"
        [modal]="true"
        [dismissableMask]="true"
        [draggable]="false"
        [resizable]="false"
        [breakpoints]="dialogBreakpoints"
        [style]="{ width: '50vw', maxWidth: '500px' }"
        appendTo="body"
      >
        @if (selectedBox(); as box) {
          <eligo-box-properties-form
            [box]="box"
            [drawerHeight]="drawerService.drawerConfig().height"
            [embedded]="true"
            [visibleSections]="['basic', 'dimensions']"
          />
        }
      </p-dialog>

      <!-- Drawer Dimensions Dialog -->
      <p-dialog
        header="Wymiary szuflady"
        [(visible)]="drawerDialogVisible"
        [modal]="true"
        [dismissableMask]="true"
        [draggable]="false"
        [resizable]="false"
        [breakpoints]="dialogBreakpoints"
        [style]="{ width: '50vw', maxWidth: '500px' }"
        appendTo="body"
      >
        <eligo-drawer-properties-form
          [config]="drawerService.drawerConfig()"
          [embedded]="true"
        />
      </p-dialog>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasStage implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLElement>;

  protected readonly drawerService = inject(DrawerService);
  protected readonly stateService = inject(ConfiguratorStateService);
  private readonly factoryService = inject(ThreeFactoryService);
  private readonly gridService = inject(GridService);
  private readonly captureService = inject(SceneCaptureService);
  private readonly platformId = inject(PLATFORM_ID);

  private facade!: ThreeSceneFacade;
  private drawerVisualizer!: DrawerVisualizer;
  private boxVisualizer!: BoxVisualizer;
  private interactionManager!: InteractionManager;
  private resizeObserver!: ResizeObserver;

  // UI State
  protected readonly colorDialogVisible = signal<boolean>(false);
  protected readonly settingsDialogVisible = signal<boolean>(false);
  protected readonly drawerDialogVisible = signal<boolean>(false);
  readonly controlsHelpVisible = signal<boolean>(false);
  protected readonly is2DMode = signal<boolean>(true);

  // Computed
  protected readonly selectedBox = computed(() => {
    const id = this.stateService.selectedBoxId();
    return this.drawerService.boxes().find((b) => b.id === id) || null;
  });

  protected readonly selectedBoxDimensions = computed(() => {
    const box = this.selectedBox();
    if (!box) return null;
    return {
      width: this.gridService.gridUnitsToMm(box.width),
      depth: this.gridService.gridUnitsToMm(box.depth),
      height: box.height,
    };
  });

  protected readonly dialogBreakpoints = { '960px': '75vw', '640px': '90vw' };
  
  protected readonly viewOptions = [
    { label: '3D', value: false },
    { label: '2D', value: true }
  ];

  constructor() {
    effect(() => {
      const config = this.drawerService.drawerConfig();
      this.gridService.updateDrawerDimensions(config.width, config.depth);

      if (this.drawerVisualizer) {
        this.drawerVisualizer.update(config);
      }
      if (this.interactionManager && this.facade) {
        this.updateControlsForConfig(config);
        const is2D = untracked(() => this.is2DMode());
        this.facade.setViewMode(is2D ? '2d' : '3d');
      }
    });

    effect(() => {
      const boxes = this.drawerService.boxes();
      const selectedId = this.stateService.selectedBoxId();
      const errors = this.drawerService.validationErrors();
      const gridLayout = this.gridService.gridLayout();

      if (this.boxVisualizer) {
        this.boxVisualizer.update(boxes, selectedId, errors, this.is2DMode());
      }

      if (this.interactionManager) {
        const oversizedIds = new Set(errors.filter(e => e.type === 'oversized').map(e => e.boxId));
        this.interactionManager.setOversizedBoxes(oversizedIds);
        this.interactionManager.setSelectedBox(selectedId);
        // Update boxes and grid layout for constraint validation
        this.interactionManager.updateBoxes(boxes);
        this.interactionManager.updateGridLayout(gridLayout);
      }
    });
    effect(() => {
      const mode = this.is2DMode() ? '2d' : '3d';
      if (this.facade) {
        this.facade.setViewMode(mode);
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initThree();
      this.initResizeObserver();
    }
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.resizeObserver?.disconnect();
    this.drawerVisualizer?.dispose();
    this.boxVisualizer?.dispose();
    this.facade?.dispose();
  }

  onPointerDown(event: PointerEvent): void {
    this.interactionManager.onPointerDown(event, this.getCanvasRect());
  }

  onPointerMove(event: PointerEvent): void {
    this.interactionManager.onPointerMove(event, this.getCanvasRect());
  }

  onPointerUp(event: PointerEvent): void {
    this.interactionManager.onPointerUp(event);
  }

  addBox(preset?: BoxPreset): void {
    this.stateService.startAddingBox();
    const width = preset?.width ?? 6;
    const depth = preset?.depth ?? 6;
    const name = preset?.label ?? 'Pudełko';
    const { x, y } = this.drawerService.findFirstFreePosition(width, depth) || { x: 0, y: 0 };

    this.drawerService.addBox({
      width, depth, height: 50, x, y,
      color: 'white', name,
    });
    this.stateService.finishAddingBox();
  }

  public captureScene(): string {
    return this.captureService.captureScene(
      this.facade,
      this.drawerService.boxes(),
      this.drawerService.drawerConfig().width,
      this.drawerService.drawerConfig().depth
    );
  }

  private initThree(): void {
    const container = this.canvasContainer.nativeElement;
    if (!container || container.clientWidth === 0) {
      setTimeout(() => this.initThree(), 50);
      return;
    }

    this.facade = new ThreeSceneFacade(container);
    this.facade.init();

    this.drawerVisualizer = new DrawerVisualizer(this.facade.getScene(), this.factoryService, this.gridService);
    this.boxVisualizer = new BoxVisualizer(this.facade.getScene(), this.factoryService, this.gridService);
    this.interactionManager = new InteractionManager(this.facade.getCamera(), this.facade.getScene(), this.gridService);

    this.setupInteractionSubscriptions();
    this.performInitialRender();
  }

  private setupInteractionSubscriptions(): void {
    this.interactionManager.boxSelected$.subscribe(id => this.stateService.selectBox(id));
    this.interactionManager.boxDrag$.subscribe(ev => this.drawerService.updateBox(ev.id, { x: ev.x, y: ev.y }));
    this.interactionManager.boxResize$.subscribe(ev => this.drawerService.updateBox(ev.id, {
      width: ev.width, depth: ev.depth, x: ev.x, y: ev.y
    }));
    this.interactionManager.boxClicked$.subscribe(id => {
      if (this.drawerService.validationErrors().find(e => e.boxId === id && e.type === 'boundary')) {
        this.drawerService.repositionBox(id);
      }
    });
    this.interactionManager.dragStart$.subscribe(() => this.facade.enableControls(false));
    this.interactionManager.dragEnd$.subscribe(() => this.facade.enableControls(true));
  }

  protected duplicateSelected(): void {
    const id = this.stateService.selectedBoxId();
    if (id) this.drawerService.duplicateBox(id);
  }

  protected rotateSelected(): void {
    const id = this.stateService.selectedBoxId();
    if (id) this.drawerService.rotateBox(id);
  }

  protected removeSelected(): void {
    const id = this.stateService.selectedBoxId();
    if (id) {
      this.drawerService.removeBox(id);
      this.stateService.selectBox(null);
    }
  }

  protected zoomIn(): void { this.facade?.zoomIn(); }
  protected zoomOut(): void { this.facade?.zoomOut(); }

  protected setMode(is2D: boolean): void {
    this.is2DMode.set(is2D);
  }

  private performInitialRender(): void {
    const config = this.drawerService.drawerConfig();
    this.gridService.updateDrawerDimensions(config.width, config.depth);
    this.drawerVisualizer.update(config);
    this.boxVisualizer.update(this.drawerService.boxes(), this.stateService.selectedBoxId(), this.drawerService.validationErrors(), this.is2DMode());
    this.updateControlsForConfig(config);
    this.facade.setViewMode(this.is2DMode() ? '2d' : '3d');
  }

  private updateControlsForConfig(config: DrawerConfig): void {
    this.interactionManager.updateDrawerDimensions(config.width, config.depth);
    this.facade.setControlsTarget(config.width / 2, 0, config.depth / 2);
    this.facade.setDrawerDimensions(config.width, config.depth);
  }

  private initResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.facade.resize(entry.contentRect.width, entry.contentRect.height);
      }
    });
    this.resizeObserver.observe(this.canvasContainer.nativeElement);
  }

  private getCanvasRect(): DOMRect {
    return this.canvasContainer.nativeElement.getBoundingClientRect();
  }
}
