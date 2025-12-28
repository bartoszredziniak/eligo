/**
 * Constants for 3D scene configuration
 */

export const BOX_WALL_THICKNESS = 3;
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
  IS_HANDLE: 'isHandle',
  HANDLE_SIDE: 'handleSide',
} as const;

export const LABEL_MESH_NAME = 'label';

export enum HandleSide {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
}
