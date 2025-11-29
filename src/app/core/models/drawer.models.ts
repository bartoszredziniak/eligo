export interface DrawerConfig {
  width: number;
  depth: number;
  height: number;
}

export type BoxColor = 'black' | 'white' | 'beige' | 'light-gray' | 'dark-gray';

export const BOX_COLORS: { label: string; value: BoxColor; hex: string }[] = [
  { label: 'Czarny', value: 'black', hex: '#000000' },
  { label: 'Biały', value: 'white', hex: '#ffffff' },
  { label: 'Beżowy', value: 'beige', hex: '#f5f5dc' },
  { label: 'Jasny Szary', value: 'light-gray', hex: '#d3d3d3' },
  { label: 'Ciemny Szary', value: 'dark-gray', hex: '#a9a9a9' },
];


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

export interface BoxPreset {
  label: string;
  width: number; // grid units
  depth: number; // grid units
}

export const BOX_PRESETS: BoxPreset[] = [
  { label: 'Łyżeczki', width: 6, depth: 10 },
  { label: 'Widelczyki', width: 6, depth: 10 },
  { label: 'Noże', width: 6, depth: 16 },
  { label: 'Łyżki', width: 6, depth: 16 },
  { label: 'Widelce', width: 6, depth: 16 },
  { label: 'Łopatki/Chochle', width: 8, depth: 20 },
];


