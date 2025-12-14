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
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { ThreeSceneFacade } from '../../three/three-scene.facade';
import { DrawerVisualizer } from '../../three/visualizers/drawer.visualizer';
import { BoxVisualizer } from '../../three/visualizers/box.visualizer';
import { InteractionManager } from '../../three/interaction.manager';
import { DrawerService } from '../../../../core/services/drawer.service';
import { ConfiguratorStateService } from '../../../../core/services/configurator-state.service';
import { GridService } from '../../../../core/services/grid.service';
import { ThreeFactoryService } from '../../three/services/three-factory.service';
import { DrawerConfig } from '../../../../core/models/drawer.models';

import { ScrollableContainerComponent } from '../../../../shared/components/scrollable-container/scrollable-container.component';
import { BoxPropertiesForm } from '../forms/box-properties-form/box-properties-form';
import { DrawerPropertiesForm } from '../forms/drawer-properties-form/drawer-properties-form';

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'eligo-canvas-stage',
  imports: [
    CommonModule,
    ToolbarModule,
    ButtonModule,
    PopoverModule,
    DialogModule,
    ScrollableContainerComponent,
    BoxPropertiesForm,
    DrawerPropertiesForm
  ],
  template: `
    <div class="relative w-full h-full">
      <div
        #canvasContainer
        class="w-full h-full overflow-hidden bg-gray-50"
        (mousedown)="onMouseDown($event)"
        (mousemove)="onMouseMove($event)"
        (mouseup)="onMouseUp()"
        (mouseleave)="onMouseUp()"
      >
        <!-- Canvas will be injected here by Three.js -->
      </div>

      <!-- Toolbar at the TOP -->
      <div class="absolute top-0 left-0 right-0 z-10 pointer-events-none">

        <!-- Gradient background container -->
        <div class="bg-linear-to-b from-white/90 to-transparent pb-6 pt-2 pointer-events-auto">
          <eligo-scrollable-container>
              <div class="flex gap-1 mx-auto">
                <p-button
                  label="Dodaj pudełko"
                  icon="pi pi-plus"
                  [rounded]="true"
                  size="small"
                  severity="primary"
                  styleClass="whitespace-nowrap"
                  (onClick)="addBox()"
                />

                <p-button
                  [icon]="showLabels() ? 'pi pi-eye' : 'pi pi-eye-slash'"
                  [label]="showLabels() ? 'Ukryj etykiety' : 'Pokaż etykiety'"
                  severity="secondary"
                  [rounded]="true"
                  size="small"
                  styleClass="whitespace-nowrap"
                  (onClick)="toggleLabels()"
                />
                <p-button
                  label="Resetuj widok"
                  icon="pi pi-refresh"
                  severity="secondary"
                  [rounded]="true"
                  size="small"
                  styleClass="whitespace-nowrap"
                  (onClick)="resetView()"
                />

                <p-button
                  label="Sterowanie"
                  icon="pi pi-question-circle"
                  [rounded]="true"
                  size="small"
                  severity="secondary"
                  styleClass="whitespace-nowrap"
                  (onClick)="helpOp.toggle($event)"
                />
              </div>
          </eligo-scrollable-container>
        </div>
      </div>

      <!-- Help Popover -->
      <p-popover #helpOp>
        <div class="p-3 w-64">
          <h4 class="m-0 mb-3 font-semibold text-surface-900">Sterowanie 3D</h4>
          <ul class="list-none p-0 m-0 text-sm space-y-3">
            <li class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary">
                <i class="pi pi-sync"></i>
              </div>
              <div>
                <div class="font-medium text-surface-900">Obracanie</div>
                <div class="text-surface-500 text-xs">Lewy przycisk myszy</div>
              </div>
            </li>
            <li class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary">
                <i class="pi pi-arrows-alt"></i>
              </div>
              <div>
                <div class="font-medium text-surface-900">Przesuwanie</div>
                <div class="text-surface-500 text-xs">Prawy przycisk myszy</div>
              </div>
            </li>
            <li class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary">
                <i class="pi pi-search-plus"></i>
              </div>
              <div>
                <div class="font-medium text-surface-900">Przybliżanie</div>
                <div class="text-surface-500 text-xs">Rolka myszy</div>
              </div>
            </li>
          </ul>
        </div>
      </p-popover>

      <!-- Bottom Floating Action Bar -->
      <div class="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto" style="max-width: 95vw;">
        <!-- Visual Pill Container -->
        <div class="rounded-full bg-surface-0/90 backdrop-blur-sm shadow-xl border border-surface-200 overflow-hidden">
          <eligo-scrollable-container>
            <div class="flex gap-2 p-2">
              @if (stateService.selectedBoxId()) {
                <!-- Selected Box Actions -->
                <p-button
                  label="Kolor"
                  icon="pi pi-palette"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="colorDialogVisible.set(true)"
                />
                <p-button
                  label="Ustawienia"
                  icon="pi pi-cog"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="settingsDialogVisible.set(true)"
                />

                <div class="w-px bg-surface-200 my-1 mx-1 shrink-0"></div>

                <p-button
                  label="Duplikuj"
                  icon="pi pi-copy"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="duplicateSelected()"
                />
                <p-button
                  label="Obróć"
                  icon="pi pi-refresh"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="rotateSelected()"
                />

                <div class="w-px bg-surface-200 my-1 mx-1 shrink-0"></div>

                <p-button
                  label="Usuń"
                  icon="pi pi-trash"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  severity="danger"
                  styleClass="!text-red-500 hover:!bg-red-50"
                  (onClick)="removeSelected()"
                />
              } @else {
                <!-- No Selection Actions -->
                <p-button
                  label="Wymiary szuflady"
                  icon="pi pi-sliders-h"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  severity="secondary"
                  styleClass="whitespace-nowrap"
                  (onClick)="drawerDialogVisible.set(true)"
                />
              }
            </div>
          </eligo-scrollable-container>
        </div>
      </div>

      <!-- Color Dialog -->
      <p-dialog
        header="Wybierz kolor"
        [(visible)]="colorDialogVisible"
        [modal]="true"
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

      :host ::ng-deep .p-panel .p-panel-header {
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
      }

      :host ::ng-deep .p-panel .p-panel-content {
        padding: 0.75rem;
      }

      /* Hide scrollbar but keep functionality */
      .no-scrollbar::-webkit-scrollbar {
          display: none;
      }
      .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
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
  private readonly platformId = inject(PLATFORM_ID);

  private facade!: ThreeSceneFacade;
  private drawerVisualizer!: DrawerVisualizer;
  private boxVisualizer!: BoxVisualizer;
  private interactionManager!: InteractionManager;

  private resizeObserver!: ResizeObserver;

  // UI State
  protected readonly showLabels = signal<boolean>(true);
  protected readonly colorDialogVisible = signal<boolean>(false);
  protected readonly settingsDialogVisible = signal<boolean>(false);
  protected readonly drawerDialogVisible = signal<boolean>(false);

  // Computed
  protected readonly selectedBox = computed(() => {
    const id = this.stateService.selectedBoxId();
    if (!id) return null;
    return this.drawerService.boxes().find((b) => b.id === id) || null;
  });



  // Dialog Configuration
  protected readonly dialogBreakpoints = { '960px': '75vw', '640px': '90vw' };

  constructor() {
    effect(() => {
      const config = this.drawerService.drawerConfig();

      // Update grid service with current drawer dimensions for cached layout
      this.gridService.updateDrawerDimensions(config.width, config.depth);

      if (this.drawerVisualizer) {
        this.drawerVisualizer.update(config);
      }
      if (this.interactionManager && this.facade) {
        this.updateControlsForConfig(config);
      }
    });

    effect(() => {
      const boxes = this.drawerService.boxes();
      const selectedId = this.stateService.selectedBoxId();
      const errors = this.drawerService.validationErrors();
      const showLabels = this.showLabels();

      if (this.boxVisualizer) {
        this.boxVisualizer.update(boxes, selectedId, errors, showLabels);
      }

      if (this.interactionManager) {
        const oversizedIds = new Set<string>();
        errors.forEach(e => {
          if (e.type === 'oversized') {
            oversizedIds.add(e.boxId);
          }
        });
        this.interactionManager.setOversizedBoxes(oversizedIds);
      }
    });
  }

  ngAfterViewInit(): void {
    // Only initialize Three.js in the browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      this.initThree();
      this.initResizeObserver();
    }
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.drawerVisualizer) {
      this.drawerVisualizer.dispose();
    }
    if (this.boxVisualizer) {
      this.boxVisualizer.dispose();
    }
    if (this.facade) {
      this.facade.dispose();
    }
  }

  onMouseDown(event: MouseEvent): void {
    const rect = this.canvasContainer.nativeElement.getBoundingClientRect();
    this.interactionManager.onPointerDown(event, rect);
  }

  onMouseMove(event: MouseEvent): void {
    const rect = this.canvasContainer.nativeElement.getBoundingClientRect();
    this.interactionManager.onPointerMove(event, rect);
  }

  onMouseUp(): void {
    this.interactionManager.onPointerUp();
  }

  resetView(): void {
    if (this.facade) {
      this.facade.resetCamera();
    }
  }

  toggleLabels(): void {
    this.showLabels.update(v => !v);
  }

  addBox(): void {
    this.stateService.startAddingBox();

    const width = 6; // grid units
    const depth = 6; // grid units

    // Find free position safely, defaulting to 0,0 if service returns null for some reason
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

  private initThree(): void {
    const container = this.canvasContainer.nativeElement;

    if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
      // Retry initialization if container has no dimensions yet
      setTimeout(() => this.initThree(), 100);
      return;
    }

    this.facade = new ThreeSceneFacade(container);
    this.facade.init();

    const scene = this.facade.getScene();
    const camera = this.facade.getCamera();

    this.drawerVisualizer = new DrawerVisualizer(scene, this.factoryService, this.gridService);
    this.boxVisualizer = new BoxVisualizer(scene, this.factoryService, this.gridService);
    this.interactionManager = new InteractionManager(camera, scene, this.gridService);

    this.setupInteractionSubscriptions();
    this.performInitialRender();
  }

  private setupInteractionSubscriptions(): void {
    this.interactionManager.boxSelected$.subscribe((boxId) => {
      this.stateService.selectBox(boxId);
    });

    this.interactionManager.boxDrag$.subscribe((event) => {
      this.drawerService.updateBox(event.id, { x: event.x, y: event.y });
    });

    this.interactionManager.boxResize$.subscribe((event) => {
      this.drawerService.updateBox(event.id, {
        width: event.width,
        depth: event.depth,
        x: event.x,
        y: event.y
      });
    });

    this.interactionManager.boxClicked$.subscribe((boxId) => {
      // Check if box has boundary error
      const errors = this.drawerService.validationErrors();
      const boundaryError = errors.find(e => e.boxId === boxId && e.type === 'boundary');

      if (boundaryError) {
        this.drawerService.repositionBox(boxId);
      }
    });

    this.interactionManager.dragStart$.subscribe(() => {
      this.facade.enableControls(false);
    });

    this.interactionManager.dragEnd$.subscribe(() => {
      this.facade.enableControls(true);
    });
  }

  protected duplicateSelected(): void {
    const id = this.stateService.selectedBoxId();
    if (id) {
      this.drawerService.duplicateBox(id);
    }
  }

  protected rotateSelected(): void {
    const id = this.stateService.selectedBoxId();
    if (id) {
      this.drawerService.rotateBox(id);
    }
  }

  protected removeSelected(): void {
    const id = this.stateService.selectedBoxId();
    if (id) {
      this.drawerService.removeBox(id);
      this.stateService.selectBox(null);
    }
  }


  private performInitialRender(): void {
    const config = this.drawerService.drawerConfig();

    // Initialize grid service with drawer dimensions
    this.gridService.updateDrawerDimensions(config.width, config.depth);

    this.drawerVisualizer.update(config);
    this.boxVisualizer.update(
      this.drawerService.boxes(),
      this.stateService.selectedBoxId(),
      this.drawerService.validationErrors(),
      this.showLabels()
    );
    this.updateControlsForConfig(config);
  }

  private updateControlsForConfig(config: DrawerConfig): void {
    this.interactionManager.updateDrawerDimensions(config.width, config.depth);
    this.facade.setControlsTarget(config.width / 2, 0, config.depth / 2);
  }

  /**
   * Capture the current 3D scene as a base64 image for PDF generation
   */
  public captureScene(): string {
    if (!this.facade) {
      return '';
    }

    const scene = this.facade.getScene();
    const camera = this.facade.getCamera();
    const originalBackground = scene.background;

    // Store current camera state
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();

    // 1. Set white background for PDF
    scene.background = new THREE.Color(0xffffff);

    // 2. Switch to top-down view for PDF
    // Position high up on Y axis, looking at center
    const config = this.drawerService.drawerConfig();
    const centerX = config.width / 2;
    const centerZ = config.depth / 2;

    camera.position.set(centerX, 1000, centerZ);
    camera.lookAt(centerX, 0, centerZ);
    camera.updateProjectionMatrix();

    // 3. Add labels for each box (always show labels for PDF)
    const boxes = this.drawerService.boxes();
    const labels: THREE.Sprite[] = [];

    boxes.forEach((box, index) => {
      const sprite = this.factoryService.createLabelSprite(`${index + 1}`);
      const coords = this.gridService.convertBoxToMm(box);

      // Position above the box center
      sprite.position.set(
        coords.x + coords.width / 2,
        coords.height + 30, // Lift label above the box
        coords.y + coords.depth / 2
      );

      scene.add(sprite);
      labels.push(sprite);
    });

    // 4. Render the scene with changes
    this.facade.render();

    // 5. Capture canvas
    const canvas = this.facade.getRenderer().domElement;
    const dataUrl = canvas.toDataURL('image/png', 0.8);

    // 6. Cleanup labels
    labels.forEach(label => {
      scene.remove(label);
      label.material.map?.dispose();
      label.material.dispose();
    });

    // 7. Restore original background
    scene.background = originalBackground;

    // 8. Restore camera
    camera.position.copy(originalPosition);
    camera.rotation.copy(originalRotation);
    camera.updateProjectionMatrix();

    // 9. Render again to restore view for user
    this.facade.render();

    return dataUrl;
  }

  private initResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.facade.resize(width, height);
      }
    });
    this.resizeObserver.observe(this.canvasContainer.nativeElement);
  }
}
