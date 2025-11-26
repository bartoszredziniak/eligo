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
import { ThreeSceneFacade } from '../../three/three-scene.facade';
import { DrawerVisualizer } from '../../three/visualizers/drawer.visualizer';
import { BoxVisualizer } from '../../three/visualizers/box.visualizer';
import { InteractionManager } from '../../three/interaction.manager';
import { DrawerService } from '../../../../core/services/drawer.service';
import { ConfiguratorStateService } from '../../../../core/services/configurator-state.service';
import { ThreeFactoryService } from '../../three/services/three-factory.service';

@Component({
  selector: 'eligo-canvas-stage',
  imports: [CommonModule],
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

  private readonly drawerService = inject(DrawerService);
  private readonly stateService = inject(ConfiguratorStateService);
  private readonly factoryService = inject(ThreeFactoryService);

  private facade!: ThreeSceneFacade;
  private drawerVisualizer!: DrawerVisualizer;
  private boxVisualizer!: BoxVisualizer;
  private interactionManager!: InteractionManager;

  private resizeObserver!: ResizeObserver;

  constructor() {
    // Effect for Drawer Config changes
    effect(() => {
      const config = this.drawerService.drawerConfig();
      if (this.drawerVisualizer) {
        this.drawerVisualizer.update(config);
      }
      if (this.interactionManager) {
        this.interactionManager.updateDrawerDimensions(config.width, config.depth);
      }
    });

    // Effect for Boxes and Selection changes
    effect(() => {
      const boxes = this.drawerService.boxes();
      const selectedId = this.stateService.selectedBoxId();
      if (this.boxVisualizer) {
        this.boxVisualizer.update(boxes, selectedId);
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
    // Dispose visualizers first to clean up meshes/geometries
    if (this.drawerVisualizer) {
      this.drawerVisualizer.dispose();
    }
    if (this.boxVisualizer) {
      this.boxVisualizer.dispose();
    }
    // Then dispose facade (renderer, scene, controls)
    if (this.facade) {
      this.facade.dispose();
    }
  }

  private initThree(): void {
    const container = this.canvasContainer.nativeElement;

    // 1. Initialize Facade
    this.facade = new ThreeSceneFacade(container);
    this.facade.init();

    const scene = this.facade.getScene();
    const camera = this.facade.getCamera();

    // 2. Initialize Visualizers
    this.drawerVisualizer = new DrawerVisualizer(scene, this.factoryService);
    this.boxVisualizer = new BoxVisualizer(scene, this.factoryService);

    // 3. Initialize Interaction Manager
    this.interactionManager = new InteractionManager(camera, scene);

    // Subscribe to selection events
    this.interactionManager.boxSelected$.subscribe((boxId) => {
      this.stateService.selectBox(boxId);
    });

    // Subscribe to drag events
    this.interactionManager.boxDrag$.subscribe((event) => {
      // We can debounce this if performance is an issue, but for now direct update is fine
      // or we can update a local signal and commit on pointer up?
      // For smooth 3D update, we need to update the store which updates the signal which updates the visualizer.
      // This might be too slow for 60fps drag. 
      // Ideally visualizer updates mesh directly during drag, and we commit to store on up.
      // But for simplicity let's try direct update first.
      this.drawerService.updateBox(event.id, { x: event.x, y: event.y });
    });

    // Initial render
    this.drawerVisualizer.update(this.drawerService.drawerConfig());
    this.boxVisualizer.update(
      this.drawerService.boxes(),
      this.stateService.selectedBoxId()
    );
    
    // Update interaction manager with dimensions
    const config = this.drawerService.drawerConfig();
    this.interactionManager.updateDrawerDimensions(config.width, config.depth);
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
}
