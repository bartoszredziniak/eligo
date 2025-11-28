import { Injectable } from '@angular/core';
import { Box } from '../models/drawer.models';

@Injectable({
  providedIn: 'root',
})
export class CostCalculatorService {
  // Constants based on user requirements and standard 3D printing settings
  private readonly NOZZLE_WIDTH = 0.4; // mm
  private readonly PLA_DENSITY = 0.00124; // g/mm³ (1.24 g/cm³)
  private readonly PRICE_PER_KG = 150; // PLN
  
  private readonly WALL_THICKNESS = 3; // mm
  private readonly FLOOR_THICKNESS = 3; // mm
  private readonly INFILL_DENSITY = 0.1; // 10%
  
  private readonly WALL_PERIMETERS = 1;
  private readonly FLOOR_PERIMETERS = 3;

  /**
   * Calculates the estimated mass of a box in grams.
   * @param box The box to calculate mass for
   * @param cellSize The size of a grid cell in mm (to convert grid units to mm)
   */
  calculateBoxMass(box: Box, cellSize: number): number {
    const widthMm = box.width * cellSize;
    const depthMm = box.depth * cellSize;
    const heightMm = box.height;

    // Calculate effective thickness for walls
    // Solid part = perimeters * nozzle width * 2 (inner + outer side)
    const wallSolidThickness = this.WALL_PERIMETERS * this.NOZZLE_WIDTH * 2;
    const wallInfillThickness = Math.max(0, this.WALL_THICKNESS - wallSolidThickness);
    const wallEffectiveThickness = wallSolidThickness + (wallInfillThickness * this.INFILL_DENSITY);

    // Calculate effective thickness for floor
    // Solid part = perimeters * nozzle width * 2 (top + bottom layers)
    // Assumption: "Triple outlines" for floor implies 3 solid layers top and bottom or equivalent density
    const floorSolidThickness = this.FLOOR_PERIMETERS * this.NOZZLE_WIDTH * 2;
    const floorInfillThickness = Math.max(0, this.FLOOR_THICKNESS - floorSolidThickness);
    const floorEffectiveThickness = floorSolidThickness + (floorInfillThickness * this.INFILL_DENSITY);

    // Calculate volumes
    // Floor volume (base)
    const floorVolume = widthMm * depthMm * floorEffectiveThickness;

    // Wall volume (perimeter * height * effective thickness)
    // Perimeter is calculated at the center of the wall thickness to be more precise, 
    // but for simplicity and "outer dimensions" logic, we can use the outer perimeter.
    // However, to avoid double counting corners if we just did 2*w + 2*d, let's be slightly more precise:
    // Outer perimeter = 2 * (width + depth)
    // But we are subtracting the floor height from the wall height? 
    // Usually "height" of a box includes the floor. So walls are (height - floor_thickness) high.
    
    const wallHeight = Math.max(0, heightMm - this.FLOOR_THICKNESS);
    
    
    // Let's use the "unfolded" length approximation for walls:
    // 2 * width + 2 * (depth - 2 * wall_thickness)
    // This correctly accounts for corners not being double counted.
    const wallsLength = 2 * widthMm + 2 * (depthMm - 2 * this.WALL_THICKNESS);
    const wallVolume = wallsLength * wallHeight * wallEffectiveThickness;

    const totalVolume = floorVolume + wallVolume;

    // Mass in grams
    return totalVolume * this.PLA_DENSITY;
  }

  /**
   * Calculates the price of a box based on its mass.
   * @param massInGrams Mass of the box in grams
   */
  calculateBoxPrice(massInGrams: number): number {
    const massInKg = massInGrams / 1000;
    return massInKg * this.PRICE_PER_KG;
  }
}
