import { Injectable, signal, computed } from '@angular/core';
import { GridConfig, GridLayout, BoxRenderCoordinates } from '../models/grid.models';
import { Box } from '../models/drawer.models';
import { DEFAULT_GRID_SIZE } from '../../features/configurator/three/constants';

@Injectable({
  providedIn: 'root',
})
export class GridService {
  private readonly _gridConfig = signal<GridConfig>({
    cellSize: DEFAULT_GRID_SIZE,
  });

  private readonly _drawerDimensions = signal({ width: 0, depth: 0 });

  readonly gridConfig = this._gridConfig.asReadonly();
  readonly cellSize = computed(() => this._gridConfig().cellSize);

  /**
   * Cached grid layout - recalculated only when drawer dimensions or cell size change
   */
  readonly gridLayout = computed(() => {
    const { width, depth } = this._drawerDimensions();
    const cellSize = this.cellSize();

    // Calculate how many complete grid cells fit
    const gridUnitsWidth = Math.floor(width / cellSize);
    const gridUnitsDepth = Math.floor(depth / cellSize);

    // Calculate total grid size in mm
    const totalWidthMm = gridUnitsWidth * cellSize;
    const totalDepthMm = gridUnitsDepth * cellSize;

    // Calculate offset to center the grid
    const offsetX = (width - totalWidthMm) / 2;
    const offsetY = (depth - totalDepthMm) / 2;

    return {
      gridUnitsWidth,
      gridUnitsDepth,
      offsetX,
      offsetY,
      totalWidthMm,
      totalDepthMm,
    };
  });

  /**
   * Update grid configuration
   */
  updateGridConfig(config: Partial<GridConfig>): void {
    this._gridConfig.update((current) => ({ ...current, ...config }));
  }

  /**
   * Update drawer dimensions for grid layout calculation
   */
  updateDrawerDimensions(width: number, depth: number): void {
    this._drawerDimensions.set({ width, depth });
  }

  /**
   * Convert grid units to millimeters
   */
  gridUnitsToMm(gridUnits: number): number {
    return gridUnits * this.cellSize();
  }

  /**
   * Convert millimeters to grid units (rounded down)
   */
  mmToGridUnits(mm: number): number {
    return Math.floor(mm / this.cellSize());
  }

  /**
   * Convert box from grid units to mm coordinates for 3D rendering
   */
  convertBoxToMm(box: Box): BoxRenderCoordinates {
    return {
      x: this.gridUnitsToMm(box.x),
      y: this.gridUnitsToMm(box.y),
      width: this.gridUnitsToMm(box.width),
      depth: this.gridUnitsToMm(box.depth),
      height: box.height, // already in mm
    };
  }

  /**
   * Snap a value in mm to the nearest grid position
   */
  snapToGrid(valueInMm: number): number {
    const cellSize = this.cellSize();
    return Math.round(valueInMm / cellSize) * cellSize;
  }

  /**
   * Calculate grid layout for a drawer with given dimensions
   * @deprecated Use the cached gridLayout computed signal instead
   */
  calculateGridLayout(drawerWidthMm: number, drawerDepthMm: number): GridLayout {
    const cellSize = this.cellSize();

    // Calculate how many complete grid cells fit
    const gridUnitsWidth = Math.floor(drawerWidthMm / cellSize);
    const gridUnitsDepth = Math.floor(drawerDepthMm / cellSize);

    // Calculate total grid size in mm
    const totalWidthMm = gridUnitsWidth * cellSize;
    const totalDepthMm = gridUnitsDepth * cellSize;

    // Calculate offset to center the grid
    const offsetX = (drawerWidthMm - totalWidthMm) / 2;
    const offsetY = (drawerDepthMm - totalDepthMm) / 2;

    return {
      gridUnitsWidth,
      gridUnitsDepth,
      offsetX,
      offsetY,
      totalWidthMm,
      totalDepthMm,
    };
  }

  /**
   * Clamp a position in grid units to stay within bounds
   */
  clampToGridBounds(
    positionGridUnits: number,
    sizeGridUnits: number,
    maxGridUnits: number
  ): number {
    return Math.max(0, Math.min(positionGridUnits, maxGridUnits - sizeGridUnits));
  }
}
