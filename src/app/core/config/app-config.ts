// Basic Definitions
export type BoxColor = 'black' | 'white' | 'beige' | 'light-gray' | 'dark-gray';

export interface BoxPreset {
  label: string;
  width: number; // grid units
  depth: number; // grid units
}

const COLORS: { label: string; value: BoxColor; hex: string }[] = [
  { label: 'Czarny', value: 'black', hex: '#1a1a1a' },
  { label: 'Biały', value: 'white', hex: '#fdfdfd' },
  { label: 'Beżowy', value: 'beige', hex: '#e5e0d8' },
  { label: 'Jasny Szary', value: 'light-gray', hex: '#cfd2d1' },
  { label: 'Ciemny Szary', value: 'dark-gray', hex: '#4a4d4e' },
];

const PRESETS: BoxPreset[] = [
  { label: 'Łyżeczki', width: 6, depth: 10 },
  { label: 'Widelczyki', width: 6, depth: 10 },
  { label: 'Noże', width: 6, depth: 16 },
  { label: 'Łyżki', width: 6, depth: 16 },
  { label: 'Widelce', width: 6, depth: 16 },
  { label: 'Łopatki/Chochle', width: 8, depth: 20 },
];

// Main Application Configuration
export const APP_CONFIG = {
  shopLink: 'https://allegro.pl', // Centralized Shop Link
  drawer: {
    colors: COLORS,
    presets: PRESETS,
    constraints: {
      width: { min: 200, max: 1200 },
      depth: { min: 200, max: 1200 },
      height: { min: 30, max: 300 }
    }
  }
};

// Aliases for backward compatibility
export const BOX_COLORS = APP_CONFIG.drawer.colors;
export const BOX_PRESETS = APP_CONFIG.drawer.presets;
export const DRAWER_CONSTRAINTS = APP_CONFIG.drawer.constraints;
