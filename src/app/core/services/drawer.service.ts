import { Injectable, signal, computed, inject } from '@angular/core';
import { Box, DrawerConfig } from '../models/drawer.models';
import { CostCalculatorService } from './cost-calculator.service';
import { GridService } from './grid.service';
import { CollisionService } from './collision.service';

@Injectable({
  providedIn: 'root',
})
export class DrawerService {
  private readonly costCalculator = inject(CostCalculatorService);
  private readonly gridService = inject(GridService);
  private readonly collisionService = inject(CollisionService);

  // Initial state
  private readonly _drawerConfig = signal<DrawerConfig>({
    width: 600,
    depth: 500,
    height: 100,
  });

  private readonly _boxes = signal<Box[]>([]);

  // Public signals
  readonly drawerConfig = this._drawerConfig.asReadonly();
  readonly boxes = this._boxes.asReadonly();

  readonly collisions = computed(() => {
    return this.collisionService.findCollisions(this._boxes());
  });

  readonly totalWeight = computed(() => {
    const boxes = this._boxes();
    const cellSize = this.gridService.cellSize();
    return boxes.reduce((sum, box) => {
      return sum + this.costCalculator.calculateBoxMass(box, cellSize);
    }, 0);
  });

  readonly totalPrice = computed(() => {
    return this.costCalculator.calculateBoxPrice(this.totalWeight());
  });

  updateDrawerConfig(config: Partial<DrawerConfig>) {
    this._drawerConfig.update((current) => ({ ...current, ...config }));
  }

  addBox(boxData: Omit<Box, 'id'>) {
    const newBox: Box = {
      ...boxData,
      id: crypto.randomUUID(),
    };
    this._boxes.update((boxes) => [...boxes, newBox]);
  }

  removeBox(id: string) {
    this._boxes.update((boxes) => boxes.filter((b) => b.id !== id));
  }

  updateBox(id: string, updates: Partial<Box>) {
    this._boxes.update((boxes) => boxes.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }

  /**
   * Find the first free position for a box with given dimensions
   * @param width Box width in grid units
   * @param depth Box depth in grid units
   * @returns First free position {x, y} or null if drawer is full
   */
  findFirstFreePosition(width: number, depth: number): { x: number; y: number } | null {
    const layout = this.gridService.gridLayout();
    const maxX = layout.gridUnitsWidth;
    const maxY = layout.gridUnitsDepth;

    // Try each position starting from (0,0)
    for (let y = 0; y <= maxY - depth; y++) {
      for (let x = 0; x <= maxX - width; x++) {
        // Create a temporary box at this position
        const testBox: Box = {
          id: 'temp',
          x,
          y,
          width,
          depth,
          height: 50,
          color: 'white',
          name: 'Test',
        };

        // Check if it collides with any existing box
        const hasCollision = this._boxes().some((existingBox) => {
          return this.collisionService.checkCollision(testBox, existingBox);
        });

        if (!hasCollision) {
          return { x, y };
        }
      }
    }

    // No free position found
    return null;
  }

  clearBoxes() {
    this._boxes.set([]);
  }
}
