import { Injectable, signal, computed, inject } from '@angular/core';
import { Box, DrawerConfig } from '../models/drawer.models';
import { CostCalculatorService } from './cost-calculator.service';
import { GridService } from './grid.service';

@Injectable({
  providedIn: 'root',
})
export class DrawerService {
  private readonly costCalculator = inject(CostCalculatorService);
  private readonly gridService = inject(GridService);

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

  clearBoxes() {
    this._boxes.set([]);
  }
}
