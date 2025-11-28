/**
 * Constants for 3D scene configuration
 */

export const BOX_WALL_THICKNESS = 2;
export const DRAWER_WALL_THICKNESS = 16;

/**
 * Grid system constants
 */
export const DEFAULT_GRID_SIZE = 16; // mm per grid unit
export const GRID_LINE_COLOR = 0xcccccc;
export const GRID_LINE_OPACITY = 0.3;

/**
 * Keys used in THREE.Object3D userData
 */
export const USER_DATA_KEYS = {
  BOX_ID: 'boxId',
  WIDTH: 'width',
  DEPTH: 'depth',
  HIGHLIGHT: 'highlight',
} as const;
