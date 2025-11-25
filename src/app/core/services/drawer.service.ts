import { Injectable, signal } from '@angular/core';
import { Box, DrawerConfig } from '../models/drawer.models';

@Injectable({
  providedIn: 'root',
})
export class DrawerService {
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
