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

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { ContextMenuModule } from 'primeng/contextmenu';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { ContextMenu } from 'primeng/contextmenu';

@Component({
  selector: 'eligo-canvas-stage',
  imports: [
    CommonModule, 
    ToolbarModule, 
    ButtonModule, 
    PopoverModule, 
    ContextMenuModule,
    TooltipModule
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
        (contextmenu)="$event.preventDefault()"
      >
        <!-- Canvas will be injected here by Three.js -->
      </div>

      <!-- Toolbar at the bottom (Desktop only - SpeedDial on mobile) -->
      <div class="absolute bottom-0 left-0 right-0 z-10 m-4 pointer-events-none hidden md:block">
        <p-toolbar styleClass="border-none rounded-xl bg-white/90 backdrop-blur-sm shadow-lg px-4 py-2 pointer-events-auto">
          <div class="p-toolbar-group-start"></div>
          
          <div class="p-toolbar-group-center">
            <div class="flex gap-2">
              <p-button 
                [icon]="showLabels() ? 'pi pi-eye' : 'pi pi-eye-slash'" 
                [label]="showLabels() ? 'Ukryj etykiety' : 'Pokaż etykiety'"
                severity="secondary" 
                [outlined]="true"
                (onClick)="toggleLabels()"
                pTooltip="Pokaż/ukryj etykiety pudełek"
              />
              <p-button 
                label="Resetuj widok" 
                icon="pi pi-refresh" 
                severity="secondary" 
                [outlined]="true"
                (onClick)="resetView()"
                pTooltip="Ustaw widok z góry"
              />
            </div>
          </div>

          <div class="p-toolbar-group-end">
            <p-button 
              label="Sterowanie"
              icon="pi pi-question-circle" 
              [outlined]="true"
              severity="secondary"
              (onClick)="helpOp.toggle($event)"
              pTooltip="Instrukcja sterowania"
            />
          </div>
        </p-toolbar>
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

      <!-- Context Menu -->
      <p-contextMenu #contextMenu [model]="menuItems()" appendTo="body" />
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
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasStage implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLElement>;
  @ViewChild('contextMenu') contextMenu!: ContextMenu;

  private readonly drawerService = inject(DrawerService);
  private readonly stateService = inject(ConfiguratorStateService);
  private readonly factoryService = inject(ThreeFactoryService);
  private readonly gridService = inject(GridService);
  private readonly platformId = inject(PLATFORM_ID);

  private facade!: ThreeSceneFacade;
  private drawerVisualizer!: DrawerVisualizer;
  private boxVisualizer!: BoxVisualizer;
  private interactionManager!: InteractionManager;

  private resizeObserver!: ResizeObserver;

  protected readonly menuItems = signal<MenuItem[]>([]);
  protected readonly showLabels = signal<boolean>(true);

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
      console.log('CanvasStage: ngAfterViewInit - Initializing Three.js');
      this.initThree();
      this.initResizeObserver();
    }
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    console.log('CanvasStage: ngOnDestroy - Disposing Three.js');

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

  private initThree(): void {
    const container = this.canvasContainer.nativeElement;
    
    console.log('CanvasStage: initThree - Container:', container);
    console.log('CanvasStage: initThree - Container dimensions:', {
      width: container.clientWidth,
      height: container.clientHeight,
      offsetWidth: container.offsetWidth,
      offsetHeight: container.offsetHeight
    });

    if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
      console.error('CanvasStage: initThree - Invalid container dimensions, retrying...');
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
    
    console.log('CanvasStage: initThree - Initialization complete');
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

    this.interactionManager.boxContextMenu$.subscribe(({ boxId, event }) => {
      this.stateService.selectBox(boxId);
      
      this.menuItems.set([
        {
          label: 'Duplikuj',
          icon: 'pi pi-copy',
          command: () => this.drawerService.duplicateBox(boxId)
        },
        {
          label: 'Obróć',
          icon: 'pi pi-refresh',
          command: () => this.drawerService.rotateBox(boxId)
        },
        {
          separator: true
        },
        {
          label: 'Usuń',
          icon: 'pi pi-trash',
          styleClass: 'text-red-500',
          command: () => {
            this.drawerService.removeBox(boxId);
            this.stateService.selectBox(null);
          }
        }
      ]);

      this.contextMenu.show(event);
    });

    this.interactionManager.dragStart$.subscribe(() => {
      this.facade.enableControls(false);
    });

    this.interactionManager.dragEnd$.subscribe(() => {
      this.facade.enableControls(true);
    });
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
    // We also need to know where the controls are looking at, but OrbitControls doesn't expose target easily via facade
    // However, we can just reset the camera to top-down view which is what we want.
    
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
    
    // We need to tell controls to update if we want to be 100% sure, but facade doesn't expose it directly.
    // Since we manually modified camera, the next controls.update() in loop might override it or be confused.
    // But since we restored position/rotation, it should be fine.
    // Ideally facade should have a method to save/restore view state.
    // For now, this should work as long as we don't change controls target.
    
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
