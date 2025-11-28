/**
 * Grid system models and types
 */

/**
 * Grid configuration
 */
export interface GridConfig {
  /** Size of one grid cell in millimeters */
  cellSize: number;
}

/**
 * Position on the grid in grid units (natural numbers)
 */
export interface GridPosition {
  x: number;
  y: number;
}

/**
 * Dimensions in grid units (natural numbers)
 */
export interface GridDimensions {
  width: number;
  depth: number;
}

/**
 * Box coordinates in millimeters for 3D rendering
 */
export interface BoxRenderCoordinates {
  x: number;      // position X in mm
  y: number;      // position Y (Z in 3D space) in mm
  width: number;  // width in mm
  depth: number;  // depth in mm
  height: number; // height in mm
}

/**
 * Result of grid layout calculation within a drawer
 */
export interface GridLayout {
  /** Actual grid dimensions in grid units that fit in the drawer */
  gridUnitsWidth: number;
  gridUnitsDepth: number;
  /** Offset from drawer origin to center the grid (in mm) */
  offsetX: number;
  offsetY: number;
  /** Total grid size in mm */
  totalWidthMm: number;
  totalDepthMm: number;
}
