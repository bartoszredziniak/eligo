import { Injectable, signal, computed, inject } from '@angular/core';
import { ValidationService } from './validation.service';
import { Box, DrawerConfig, BOX_COLORS } from '../models/drawer.models';
import { BoxValidationError } from '../models/validation.models';
import { CostCalculatorService } from './cost-calculator.service';
import { GridService } from './grid.service';
import { CollisionService } from './collision.service';

@Injectable({
  providedIn: 'root',
})
export class DrawerService {
  private readonly costCalculator = inject(CostCalculatorService);
  private readonly gridService = inject(GridService);
  private readonly collisionService = inject(CollisionService);
  private readonly validationService = inject(ValidationService);

  // Initial state
  private readonly _drawerConfig = signal<DrawerConfig>({
    width: 600,
    depth: 500,
    height: 100,
  });

  private readonly _boxes = signal<Box[]>([]);

  // Public signals
  readonly drawerConfig = this._drawerConfig.asReadonly();
  readonly boxes = this._boxes.asReadonly();

  readonly validationErrors = computed(() => {
    return this.validationService.validateAll(
      this._boxes(),
      this.gridService.gridLayout()
    );
  });

  readonly collisions = computed(() => {
    // For backward compatibility and specific collision checks
    const errors = this.validationErrors();
    const collisionIds = new Set<string>();
    errors.forEach((e: BoxValidationError) => {
      if (e.type === 'collision' || e.type === 'boundary' || e.type === 'oversized') {
        collisionIds.add(e.boxId);
      }
    });
    return collisionIds;
  });

  readonly totalWeight = computed(() => {
    const boxes = this._boxes();
    const cellSize = this.gridService.cellSize();
    return boxes.reduce((sum, box) => {
      return sum + this.costCalculator.calculateBoxMass(box, cellSize);
    }, 0);
  });

  readonly totalPrice = computed(() => {
    return this.costCalculator.calculateBoxPrice(this.totalWeight());
  });

  readonly configCode = computed(() => {
    return this.generateConfigCode();
  });

  updateDrawerConfig(config: Partial<DrawerConfig>) {
    this._drawerConfig.update((current) => ({ ...current, ...config }));
  }

  addBox(boxData: Omit<Box, 'id'>) {
    const newBox: Box = {
      ...boxData,
      id: crypto.randomUUID(),
    };
    this._boxes.update((boxes) => [...boxes, newBox]);
  }

  removeBox(id: string) {
    this._boxes.update((boxes) => boxes.filter((b) => b.id !== id));
  }

  updateBox(id: string, updates: Partial<Box>) {
    this._boxes.update((boxes) => boxes.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }

  /**
   * Try to reposition a box to a valid location
   */
  repositionBox(id: string) {
    const box = this._boxes().find(b => b.id === id);
    if (!box) return;

    const newPos = this.validationService.findValidPosition(
      box,
      this._boxes(),
      this.gridService.gridLayout()
    );

    if (newPos) {
      this.updateBox(id, newPos);
    }
  }

  duplicateBox(id: string) {
    const originalBox = this._boxes().find(b => b.id === id);
    if (!originalBox) return;

    // Create a copy without ID
    const { id: _unused, ...boxData } = originalBox;
    
    // Find a free position for the new box
    // We convert mm dimensions to grid units for the search
    // Note: boxData width/depth are already in grid units
    const position = this.findFirstFreePosition(boxData.width, boxData.depth);
    
    const newBox: Box = {
      ...boxData,
      id: crypto.randomUUID(),
      x: position ? position.x : 0, // Default to 0,0 if full (validation will show error)
      y: position ? position.y : 0,
      name: `${boxData.name} (Kopia)`
    };

    this._boxes.update(boxes => [...boxes, newBox]);
  }

  rotateBox(id: string) {
    const box = this._boxes().find(b => b.id === id);
    if (!box) return;

    // Swap width and depth
    const newWidth = box.depth;
    const newDepth = box.width;

    this.updateBox(id, {
      width: newWidth,
      depth: newDepth
    });
    
    // Optional: Try to reposition if it goes out of bounds or collides?
    // For now, we let the validation system handle it and show errors if any.
  }

  /**
   * Find the first free position for a box with given dimensions
   * @param width Box width in grid units
   * @param depth Box depth in grid units
   * @returns First free position {x, y} or null if drawer is full
   */
  findFirstFreePosition(width: number, depth: number): { x: number; y: number } | null {
    const layout = this.gridService.gridLayout();
    const maxX = layout.gridUnitsWidth;
    const maxY = layout.gridUnitsDepth;

    // Try each position starting from (0,0)
    for (let y = 0; y <= maxY - depth; y++) {
      for (let x = 0; x <= maxX - width; x++) {
        // Create a temporary box at this position
        const testBox: Box = {
          id: 'temp',
          x,
          y,
          width,
          depth,
          height: 50,
          color: 'white',
          name: 'Test',
        };

        // Check if it collides with any existing box
        const hasCollision = this._boxes().some((existingBox) => {
          return this.collisionService.checkCollision(testBox, existingBox);
        });

        if (!hasCollision) {
          return { x, y };
        }
      }
    }

    // No free position found
    return null;
  }

  clearBoxes() {
    this._boxes.set([]);
  }

  generateConfigCode(): string {
    const config = this._drawerConfig();
    const boxes = this._boxes();
    
    // Header: v1|width,depth,height
    let code = `v1|${config.width},${config.depth},${config.height}`;
    
    if (boxes.length > 0) {
      code += '|';
      const boxStrings = boxes.map(box => {
        // Find color index
        const colorIndex = BOX_COLORS.findIndex(c => c.value === box.color);
        // Sanitize name (remove separators)
        const safeName = box.name.replace(/[|;,]/g, ' ');
        
        return `${box.x},${box.y},${box.width},${box.depth},${box.height},${colorIndex},${safeName}`;
      });
      code += boxStrings.join(';');
    }
    
    // Encode to Base64 with UTF-8 support
    return btoa(encodeURIComponent(code).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode(parseInt(p1, 16));
        }));
  }

  restoreFromConfigCode(encodedCode: string): boolean {
    try {
      // Decode Base64 with UTF-8 support
      const code = decodeURIComponent(atob(encodedCode).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const parts = code.split('|');
      
      if (parts[0] !== 'v1') {
        console.error('Invalid config version');
        return false;
      }
      
      // Parse drawer config
      const [width, depth, height] = parts[1].split(',').map(Number);
      if (isNaN(width) || isNaN(depth) || isNaN(height)) return false;
      
      this.updateDrawerConfig({ width, depth, height });
      
      // Parse boxes
      const newBoxes: Box[] = [];
      if (parts.length > 2 && parts[2]) {
        const boxStrings = parts[2].split(';');
        
        boxStrings.forEach(boxStr => {
          const [x, y, w, d, h, cIdx, ...nameParts] = boxStr.split(',');
          const name = nameParts.join(','); // Rejoin name if it contained commas (though we replaced them)
          
          const colorIndex = parseInt(cIdx, 10);
          const color = BOX_COLORS[colorIndex]?.value || 'white';
          
          newBoxes.push({
            id: crypto.randomUUID(),
            x: parseInt(x, 10),
            y: parseInt(y, 10),
            width: parseInt(w, 10),
            depth: parseInt(d, 10),
            height: parseInt(h, 10),
            color,
            name
          });
        });
      }
      
      this._boxes.set(newBoxes);
      return true;
    } catch (e) {
      console.error('Failed to restore config', e);
      return false;
    }
  }
}
