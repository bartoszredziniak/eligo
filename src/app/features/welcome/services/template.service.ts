import { Injectable, inject } from '@angular/core';
import { Box } from '../../../core/models/drawer.models';
import { BOX_PRESETS, BoxPreset } from '../../../core/config/app-config';
import { GridService } from '../../../core/services/grid.service';
import { BoxColor } from '../../../core/config/app-config';

export type TemplateType = 'empty' | 'cutlery' | 'small' | 'large';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private gridService = inject(GridService);

  generateLayout(type: TemplateType, widthMm: number, depthMm: number, boxColor: BoxColor): Omit<Box, 'id'>[] {
    if (type === 'empty') return [];

    const widthUnits = this.gridService.mmToGridUnits(widthMm);
    const depthUnits = this.gridService.mmToGridUnits(depthMm);

    switch (type) {
      case 'cutlery':
        return this.generateCutleryLayout(widthUnits, depthUnits, boxColor);
      case 'small':
        return this.generateAdaptiveGrid(widthUnits, depthUnits, 8, 10, boxColor, 'Małe');
      case 'large':
        return this.generateAdaptiveGrid(widthUnits, depthUnits, 16, 20, boxColor, 'Duże');
      default:
        return [];
    }
  }

  private generateCutleryLayout(drawerWidth: number, drawerDepth: number, color: BoxColor): Omit<Box, 'id'>[] {
    const boxes: Omit<Box, 'id'>[] = [];
    
    const presetMap = new Map(BOX_PRESETS.map(p => [p.label, p]));
    const priorityPresets = ['Noże', 'Widelce', 'Łyżki', 'Łyżeczki', 'Widelczyki'];
    
    // 1. Determine which main items fit
    const activePresets: BoxPreset[] = [];
    let setWidth = 0;
    
    for (const label of priorityPresets) {
      const p = presetMap.get(label);
      if (p && setWidth + p.width <= drawerWidth) {
         activePresets.push(p);
         setWidth += p.width;
      }
    }
    
    if (activePresets.length === 0) return [];
    
    // 2. Calculate remaining space logic
    // If gaps < 6 units: Stretch existing boxes.
    // If gaps >= 6 units: Add filler columns on right.
    const remainingWidth = drawerWidth - setWidth;
    let extraStretchPerBox = 0;
    let fillerWidth = 0;
    
    if (remainingWidth < 6) { 
       if (activePresets.length > 0) {
           extraStretchPerBox = Math.floor(remainingWidth / activePresets.length);
       }
    } else {
       fillerWidth = remainingWidth;
    }

    let currentX = 0;
    let widthRemainder = remainingWidth < 6 ? remainingWidth % activePresets.length : 0;
    
    // 3. Place Main Set
    for (const preset of activePresets) {
        let boxW = preset.width + extraStretchPerBox;
        if (widthRemainder > 0) {
            boxW++;
            widthRemainder--;
        }
        
        const boxD = preset.depth;
        const yPos = Math.max(0, drawerDepth - boxD); // Front alignment
        
        boxes.push(this.createBox(currentX, yPos, boxW, boxD, color, preset.label));
        
        // Fill gap behind cutlery
        if (yPos >= 5) {
             boxes.push(this.createBox(currentX, 0, boxW, yPos, color, 'Dodatki'));
        }
        
        currentX += boxW;
    }
    
    // 4. Fill Right Gap
    if (fillerWidth > 0) {
        const numCols = Math.ceil(fillerWidth / 12);
        const colW = Math.floor(fillerWidth / numCols);
        let remW = fillerWidth % numCols;
        
        for (let i = 0; i < numCols; i++) {
            let finalColW = colW;
            if (remW > 0) { finalColW++; remW--; }
            
            boxes.push(this.createBox(currentX, 0, finalColW, drawerDepth, color, 'Uniwersalne'));
            currentX += finalColW;
        }
    }

    return boxes;
  }

  private createBox(x: number, y: number, width: number, depth: number, color: BoxColor, name: string): Omit<Box, 'id'> {
    return { x, y, width, depth, height: 50, color, name };
  }

  private generateAdaptiveGrid(
    maxWidth: number, 
    maxDepth: number, 
    targetSize: number, 
    unusedDepthTarget: number, // just to match signature if needed, or remove
    color: BoxColor,
    namePrefix: string
  ): Omit<Box, 'id'>[] {
    const boxes: Omit<Box, 'id'>[] = [];
    
    // Goal: Evenly distribute boxes. No "cut-off" boxes at edges.
    // Calculate optimal number of columns and rows.
    
    const numCols = Math.round(maxWidth / targetSize) || 1;
    const numRows = Math.round(maxDepth / targetSize) || 1;
    
    const colWidth = Math.floor(maxWidth / numCols);
    const rowDepth = Math.floor(maxDepth / numRows);
    
    // Distribute remainder pixels/units to first few boxes or last?
    // Let's just create them. If we have remainder, we might have slightly different sizes or gaps.
    // Better: Accumulate error or distribute remainder to first N items.
    
    const widthRemainder = maxWidth % numCols;
    const depthRemainder = maxDepth % numRows;
    
    let currentX = 0;
    
    for (let i = 0; i < numCols; i++) {
        // distribute width remainder: give +1 unit to first 'widthRemainder' columns
        const w = colWidth + (i < widthRemainder ? 1 : 0);
        
        let currentY = 0;
        for (let j = 0; j < numRows; j++) {
             const d = rowDepth + (j < depthRemainder ? 1 : 0);
             
             boxes.push(this.createBox(currentX, currentY, w, d, color, namePrefix));
             currentY += d;
        }
        currentX += w;
    }
    
    return boxes;
  }
}
