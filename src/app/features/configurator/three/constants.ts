/**
 * Constants for 3D scene configuration
 */

export const BOX_WALL_THICKNESS = 2;
export const DRAWER_WALL_THICKNESS = 16;

/**
 * Keys used in THREE.Object3D userData
 */
export const USER_DATA_KEYS = {
  BOX_ID: 'boxId',
  WIDTH: 'width',
  DEPTH: 'depth',
  HIGHLIGHT: 'highlight',
} as const;
