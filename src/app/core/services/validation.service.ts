import { Injectable, inject } from '@angular/core';
import { Box } from '../models/drawer.models';
import { GridLayout } from '../models/grid.models';
import { BoxValidationError, BoxBoundaryError } from '../models/validation.models';
import { CollisionService } from './collision.service';
import { GridService } from './grid.service';

@Injectable({
  providedIn: 'root',
})
export class ValidationService {
  private readonly collisionService = inject(CollisionService);
  private readonly gridService = inject(GridService);

  /**
   * Validate if a box fits within the grid boundaries
   */
  validateBoxBounds(box: Box, layout: GridLayout): BoxBoundaryError | null {
    const exceedsRight = box.x + box.width > layout.gridUnitsWidth;
    const exceedsBottom = box.y + box.depth > layout.gridUnitsDepth;
    
    // Check if box is physically too large for the drawer
    const canFit = box.width <= layout.gridUnitsWidth && box.depth <= layout.gridUnitsDepth;

    if (exceedsRight || exceedsBottom || !canFit) {
      return {
        exceedsRight,
        exceedsBottom,
        canFit
      };
    }

    return null;
  }

  /**
   * Find the nearest valid position for a box
   * Returns null if no valid position exists (e.g. box too big)
   */
  findValidPosition(box: Box, allBoxes: Box[], layout: GridLayout): { x: number, y: number } | null {
    // 1. Check if box fits at all
    if (box.width > layout.gridUnitsWidth || box.depth > layout.gridUnitsDepth) {
      return null;
    }

    // 2. Try to keep current position but clamped to bounds
    let targetX = Math.min(box.x, layout.gridUnitsWidth - box.width);
    let targetY = Math.min(box.y, layout.gridUnitsDepth - box.depth);
    
    // Ensure non-negative
    targetX = Math.max(0, targetX);
    targetY = Math.max(0, targetY);

    // 3. Check if this clamped position has collisions
    const tempBox = { ...box, x: targetX, y: targetY };
    const hasCollision = allBoxes.some(other => 
      other.id !== box.id && this.collisionService.checkCollision(tempBox, other)
    );

    if (!hasCollision) {
      return { x: targetX, y: targetY };
    }

    // 4. If collision, search for nearest free spot using spiral or simple grid scan
    // For simplicity and performance, we'll scan the grid
    // We prioritize positions close to the original intended position
    
    let bestPos: { x: number, y: number, dist: number } | null = null;

    // Scan reasonable area around the target position first? 
    // Or just scan the whole grid if it's small enough. 
    // Given the grid size is usually < 100x100, full scan is fine but let's optimize slightly
    // by checking distance.

    for (let y = 0; y <= layout.gridUnitsDepth - box.depth; y++) {
      for (let x = 0; x <= layout.gridUnitsWidth - box.width; x++) {
        const testBox = { ...box, x, y };
        
        // Check collision
        const collides = allBoxes.some(other => 
          other.id !== box.id && this.collisionService.checkCollision(testBox, other)
        );

        if (!collides) {
          // Calculate distance to original position
          const dist = Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2));
          
          if (bestPos === null || dist < bestPos.dist) {
            bestPos = { x, y, dist };
          }
        }
      }
    }

    return bestPos ? { x: bestPos.x, y: bestPos.y } : null;
  }

  /**
   * Generate all validation errors for a list of boxes
   */
  validateAll(boxes: Box[], layout: GridLayout): BoxValidationError[] {
    const errors: BoxValidationError[] = [];
    const collisions = this.collisionService.findCollisions(boxes);

    // 1. Add collision errors
    collisions.forEach(id => {
      const box = boxes.find(b => b.id === id);
      if (box) {
        errors.push({
          boxId: id,
          boxName: box.name,
          type: 'collision',
          message: 'Kolizja z innym pudełkiem'
        });
      }
    });

    // 2. Add boundary errors
    boxes.forEach(box => {
      const boundaryError = this.validateBoxBounds(box, layout);
      if (boundaryError) {
        // If it's already marked as collision, we might still want to show boundary error?
        // Usually boundary error is more fundamental.
        // Let's check if we already have an error for this box
        const existingError = errors.find(e => e.boxId === box.id);
        
        if (!boundaryError.canFit) {
          if (existingError) {
             // Upgrade to oversized error if it was just collision
             existingError.type = 'oversized';
             existingError.message = 'Pudełko jest za duże na tę szufladę';
          } else {
            errors.push({
              boxId: box.id,
              boxName: box.name,
              type: 'oversized',
              message: 'Pudełko jest za duże na tę szufladę'
            });
          }
        } else {
          if (!existingError) {
             errors.push({
              boxId: box.id,
              boxName: box.name,
              type: 'boundary',
              message: 'Pudełko wystaje poza szufladę'
            });
          }
        }
      }
    });

    return errors;
  }
}
