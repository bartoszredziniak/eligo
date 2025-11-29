import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
} from '@angular/core';
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

import { PanelModule } from 'primeng/panel';

@Component({
  selector: 'eligo-canvas-stage',
  imports: [CommonModule, PanelModule],
  template: `
    <div
      #canvasContainer
      class="w-full h-full relative overflow-hidden bg-gray-50"
      (mousedown)="onMouseDown($event)"
      (mousemove)="onMouseMove($event)"
      (mouseup)="onMouseUp()"
      (mouseleave)="onMouseUp()"
    >
      <!-- Canvas will be injected here by Three.js -->
      
      <div class="absolute bottom-4 right-4 z-10 w-64 opacity-90 hover:opacity-100 transition-opacity">
        <p-panel header="Sterowanie 3D" [toggleable]="true" [collapsed]="true" styleClass="text-sm">
          <ul class="list-none p-0 m-0 text-sm space-y-2">
            <li class="flex items-center gap-2">
              <i class="pi pi-sync text-primary"></i>
              <span>Obracanie: Lewy Przycisk</span>
            </li>
            <li class="flex items-center gap-2">
              <i class="pi pi-arrows-alt text-primary"></i>
              <span>Przesuwanie: Prawy Przycisk</span>
            </li>
            <li class="flex items-center gap-2">
              <i class="pi pi-search-plus text-primary"></i>
              <span>Przybliżanie: Rolka</span>
            </li>
          </ul>
        </p-panel>
      </div>
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

  private readonly drawerService = inject(DrawerService);
  private readonly stateService = inject(ConfiguratorStateService);
  private readonly factoryService = inject(ThreeFactoryService);
  private readonly gridService = inject(GridService);

  private facade!: ThreeSceneFacade;
  private drawerVisualizer!: DrawerVisualizer;
  private boxVisualizer!: BoxVisualizer;
  private interactionManager!: InteractionManager;

  private resizeObserver!: ResizeObserver;

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
      const collisions = this.drawerService.collisions();
      if (this.boxVisualizer) {
        this.boxVisualizer.update(boxes, selectedId, collisions);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initThree();
    this.initResizeObserver();
  }

  ngOnDestroy(): void {
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

  private initThree(): void {
    const container = this.canvasContainer.nativeElement;

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
      this.drawerService.collisions()
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
    const originalBackground = scene.background;

    // 1. Set white background for PDF
    scene.background = new THREE.Color(0xffffff);

    // 2. Add labels for each box
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
    
    // 3. Render the scene with changes
    this.facade.render();
    
    // 4. Capture canvas
    const canvas = this.facade.getRenderer().domElement;
    const dataUrl = canvas.toDataURL('image/png', 0.8);

    // 5. Cleanup labels
    labels.forEach(label => {
      scene.remove(label);
      label.material.map?.dispose();
      label.material.dispose();
    });
    
    // 6. Restore original background
    scene.background = originalBackground;
    
    // 7. Render again to restore view for user
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
