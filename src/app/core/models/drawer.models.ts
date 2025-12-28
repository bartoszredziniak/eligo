import { BoxColor } from '../config/app-config';

export interface DrawerConfig {
  width: number;
  depth: number;
  height: number;
}

export { BOX_COLORS, BOX_PRESETS } from '../config/app-config';
export type { BoxColor, BoxPreset } from '../config/app-config';

export interface Box {
  id: string;
  name: string;
  /** X position in grid units */
  x: number;
  /** Y position in grid units */
  y: number;
  /** Width in grid units */
  width: number;
  /** Depth in grid units */
  depth: number;
  /** Height in millimeters (not grid-based) */
  height: number;
  color: BoxColor;
}



