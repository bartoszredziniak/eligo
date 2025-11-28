import { Injectable } from '@angular/core';
import { Box } from '../models/drawer.models';

@Injectable({
  providedIn: 'root',
})
export class CollisionService {
  /**
   * Checks if two boxes collide.
   * Uses grid units (integers) for robust collision detection.
   */
  checkCollision(b1: Box, b2: Box): boolean {
    // Check if one box is to the left of the other
    if (b1.x + b1.width <= b2.x || b2.x + b2.width <= b1.x) {
      return false;
    }

    // Check if one box is above the other (in 2D grid terms, "above" means lower Y index usually, but here just Y axis separation)
    if (b1.y + b1.depth <= b2.y || b2.y + b2.depth <= b1.y) {
      return false;
    }

    // If neither, they overlap
    return true;
  }

  /**
   * Finds all boxes that are colliding with any other box.
   * Returns a Set of Box IDs.
   */
  findCollisions(boxes: Box[]): Set<string> {
    const collisions = new Set<string>();

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const b1 = boxes[i];
        const b2 = boxes[j];

        if (this.checkCollision(b1, b2)) {
          collisions.add(b1.id);
          collisions.add(b2.id);
        }
      }
    }

    return collisions;
  }
}
