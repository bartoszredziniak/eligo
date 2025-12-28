import * as THREE from 'three';
import { Box, BoxColor } from '../../../../core/models/drawer.models';
import { BoxValidationError } from '../../../../core/models/validation.models';
import { ThreeFactoryService } from '../services/three-factory.service';
import { GridService } from '../../../../core/services/grid.service';
import { HandleSide, USER_DATA_KEYS } from '../constants';

const LABEL_MESH_NAME = 'label';

export class BoxMeshPool {
  private available: THREE.Mesh[] = [];
  private inUse: Map<string, THREE.Mesh> = new Map<string, THREE.Mesh>();

  constructor(
    private readonly scene: THREE.Scene,
    private readonly factory: ThreeFactoryService,
    private readonly gridService: GridService
  ) {}

  updateBoxes(boxes: Box[], selectedId: string | null, errors: BoxValidationError[], is2D: boolean): void {
    const newIds = new Set(boxes.map((b) => b.id));

    this.removeUnusedBoxes(newIds);
    this.createOrUpdateBoxes(boxes, selectedId, errors, is2D);
  }

  dispose(): void {
    this.disposeGeometries(this.available);
    this.disposeGeometries(Array.from(this.inUse.values()));
    this.available = [];
    this.inUse.clear();
  }

  private removeUnusedBoxes(newIds: Set<string>): void {
    for (const [id, mesh] of this.inUse.entries()) {
      if (!newIds.has(id)) {
        this.release(id, mesh);
      }
    }
  }

  private createOrUpdateBoxes(boxes: Box[], selectedId: string | null, errors: BoxValidationError[], is2D: boolean): void {
    for (const box of boxes) {
      let mesh = this.inUse.get(box.id);
      const isSelected = box.id === selectedId;
      const error = errors.find((e) => e.boxId === box.id);

      if (!mesh) {
        mesh = this.acquire();
        this.inUse.set(box.id, mesh);
        this.scene.add(mesh);
        mesh.userData[USER_DATA_KEYS.BOX_ID] = box.id;
        // Force full update for new mesh
        this.updateMesh(mesh, box, isSelected, error, is2D);
      } else {
        // Check if full update is needed
        const coords = this.gridService.convertBoxToMm(box);
        const prevWidth = mesh.userData[USER_DATA_KEYS.WIDTH];
        const prevDepth = mesh.userData[USER_DATA_KEYS.DEPTH];
        const prevColor = mesh.userData['boxColor'];
        
        // Check if geometry needs rebuild
        if (
          Math.abs(prevWidth - coords.width) < 0.01 &&
          Math.abs(prevDepth - coords.depth) < 0.01 &&
          Math.abs((mesh.userData['height'] || 0) - coords.height) < 0.01 &&
          prevColor === box.color
        ) {
           // Geometry and color same, just update position and visual overlays
           const group = mesh as unknown as THREE.Group;
           group.position.set(coords.x + coords.width / 2, 0.2, coords.y + coords.depth / 2);
           
           // Check if name changed for label update
           const prevName = mesh.userData['boxName'];
           
           if (prevName !== box.name) {
             this.updateLabel(mesh as unknown as THREE.Group, box.name, coords.width, coords.depth);
             mesh.userData['boxName'] = box.name;
           }

           this.updateMesh(mesh, box, isSelected, error, is2D); // Re-run update even if mostly same to check label visibility
        } else {
           this.updateMesh(mesh, box, isSelected, error, is2D);
        }
      }
    }
  }

  private acquire(): THREE.Mesh {
    if (this.available.length > 0) {
      const mesh = this.available.pop()!;
      mesh.visible = true;
      return mesh;
    }
    return this.factory.createBoxMesh(1, 1, 1, 'white');
  }

  private release(id: string, mesh: THREE.Mesh): void {
    mesh.visible = false;
    this.scene.remove(mesh);
    this.inUse.delete(id);
    this.available.push(mesh);
  }


  private updateMesh(mesh: THREE.Mesh, box: Box, isSelected: boolean, error: BoxValidationError | undefined, is2D: boolean): void {
    const group = mesh as unknown as THREE.Group;

    const coords = this.gridService.convertBoxToMm(box);
    const prevWidth = group.userData[USER_DATA_KEYS.WIDTH];
    const prevDepth = group.userData[USER_DATA_KEYS.DEPTH];
    const prevName = group.userData['boxName'];
    const prevColor = group.userData['boxColor'];

    const dimensionsChanged = 
      Math.abs(prevWidth - coords.width) > 0.01 || 
      Math.abs(prevDepth - coords.depth) > 0.01 ||
      Math.abs((group.userData['height'] || 0) - coords.height) > 0.01;
    const colorChanged = prevColor !== box.color;
    const nameChanged = prevName !== box.name;

    if (dimensionsChanged || colorChanged) {
        this.disposeGeometries(group.children.filter((c) => c.name !== USER_DATA_KEYS.HIGHLIGHT));
        group.clear();

        // Apply a small visual gap to prevent z-fighting/overlapping artifacts
        const VISUAL_GAP = 0.5;
        const visualWidth = Math.max(1, coords.width - VISUAL_GAP);
        const visualDepth = Math.max(1, coords.depth - VISUAL_GAP);

        const newGroup = this.factory.createHollowBoxGroup(visualWidth, coords.height, visualDepth, box.color);
        this.transferChildren(newGroup, group);

        // Position using logical mm coordinates to keep center correct
        group.position.set(coords.x + coords.width / 2, 0.2, coords.y + coords.depth / 2);

        group.userData[USER_DATA_KEYS.BOX_ID] = box.id;
        group.userData[USER_DATA_KEYS.WIDTH] = coords.width;
        group.userData[USER_DATA_KEYS.DEPTH] = coords.depth;
        group.userData['height'] = coords.height;
        group.userData['boxColor'] = box.color;
    } else {
        // Just update position if needed
        group.position.set(coords.x + coords.width / 2, 0, coords.y + coords.depth / 2);
    }

    // Handle Label - recreate when name, dimensions, color changes
    if (nameChanged || dimensionsChanged || colorChanged) { 
        this.updateLabel(group, box.name, coords.width, coords.depth);
        group.userData['boxName'] = box.name;
    }

    // Update Label Visibility
    const label = group.children.find(c => c.name === LABEL_MESH_NAME);
    if (label) {
        label.visible = is2D;
    }

    this.updateVisualState(mesh, coords.width, coords.height, coords.depth, isSelected, error);
  }

  private updateLabel(group: THREE.Group, text: string, width: number, depth: number): void {
    // Remove existing label
    const existingLabel = group.children.find((c) => c.name === LABEL_MESH_NAME);
    if (existingLabel) {
      group.remove(existingLabel);
      if (existingLabel.userData['dispose']) {
        existingLabel.userData['dispose']();
      } else {
        // Fallback disposal
        const mesh = existingLabel as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.dispose();
          if (mat.map) mat.map.dispose();
        }
      }
    }

    try {
      // Create new label
      const labelMesh = this.factory.createLabelMesh(text, width, depth, group.userData['boxColor']);
      if (labelMesh) {
        // Position on the BOTTOM inside of the box
        // floorThickness is 3mm. We place it slightly above the floor surface.
        labelMesh.position.set(0, 3.2, 0); 
        group.add(labelMesh);
      }
    } catch (e) {
      console.error('Error creating label mesh:', e);
    }
  }


  private updateVisualState(
    mesh: THREE.Mesh,
    widthMm: number,
    heightMm: number,
    depthMm: number,
    isSelected: boolean,
    error: BoxValidationError | undefined
  ): void {
    // Handle Selection Highlight
    this.handleHighlight(mesh, widthMm, heightMm, depthMm, isSelected);
    // Handles removed - resizing is now done via UI properties form

    // Handle Error State (Red Color Overlay or Material Swap)
    const group = mesh as unknown as THREE.Group;
    group.children.forEach((child) => {
      // Skip label and highlight from material override
      if (child.name === USER_DATA_KEYS.HIGHLIGHT || child.name === LABEL_MESH_NAME) return;
      
      const meshChild = child as THREE.Mesh;
      if (error) {
        meshChild.material = this.factory.getErrorMaterial();
      } else {
        // Restore original material based on box color stored in userData
        const color = group.userData['boxColor'] as BoxColor;
        if (color) {
           meshChild.material = this.factory.getBoxMaterial(color);
        }
      }
    });
  }

  private handleHighlight(
    mesh: THREE.Mesh,
    widthMm: number,
    heightMm: number,
    depthMm: number,
    isSelected: boolean
  ): void {
    const existingHighlight = mesh.children.find((c) => c.name === USER_DATA_KEYS.HIGHLIGHT);

    if (existingHighlight) {
      mesh.remove(existingHighlight);
      this.disposeLineSegments(existingHighlight as THREE.LineSegments);
    }

    if (isSelected) {
      const highlight = this.factory.createSelectionHighlight(widthMm, heightMm, depthMm);
      highlight.name = USER_DATA_KEYS.HIGHLIGHT;
      // Offset is now handled inside createSelectionHighlight for consistency
      mesh.add(highlight);
      
      this.updateHandles(mesh, widthMm, heightMm, depthMm, true);
    } else {
      this.updateHandles(mesh, widthMm, heightMm, depthMm, false);
    }
  }

  private updateHandles(mesh: THREE.Mesh, width: number, height: number, depth: number, visible: boolean): void {
    const existingHandles = mesh.children.filter(c => c.userData[USER_DATA_KEYS.HANDLE_SIDE]);
    
    // If not visible, remove all
    if (!visible) {
      existingHandles.forEach(h => {
        mesh.remove(h);
        this.disposeObject(h);
      });
      return;
    }

    // If visible, ensure they exist and are positioned correctly
    const sides = [HandleSide.LEFT, HandleSide.RIGHT, HandleSide.TOP, HandleSide.BOTTOM];
    
    sides.forEach(side => {
      let handle = existingHandles.find(h => h.userData[USER_DATA_KEYS.HANDLE_SIDE] === side);
      
      if (!handle) {
        const newHandle = this.factory.createResizeHandleMesh() as unknown as THREE.Object3D;
        newHandle.userData[USER_DATA_KEYS.HANDLE_SIDE] = side;
        newHandle.userData[USER_DATA_KEYS.BOX_ID] = mesh.userData[USER_DATA_KEYS.BOX_ID]; 
        mesh.add(newHandle);
        handle = newHandle;
      }

      // Explicitly check for handle to satisfy strict null checks
      if (!handle) return;

      // Actually, for "Top-Down" view, Y doesn't matter much for hit testing if we raycast appropriately,
      // but visually it should be on top.
      // Let's say handles are floating at height + 10mm.
      
      // mesh.userData doesn't have height stored easily? 
      // updateVisualState receives heightMm.
      
      const hY = height + 10;

      switch (side) {
        case HandleSide.LEFT:
           handle.position.set(-width / 2, hY, 0);
           break;
        case HandleSide.RIGHT:
           handle.position.set(width / 2, hY, 0);
           break;
        case HandleSide.TOP: // Back (-Z)
           handle.position.set(0, hY, -depth / 2);
           break;
        case HandleSide.BOTTOM: // Front (+Z)
           handle.position.set(0, hY, depth / 2);
           break;
      }
    });
  }

  private disposeGeometries(objects: THREE.Object3D[]): void {
    objects.forEach((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
    });
  }

  private disposeLineSegments(lineSegments: THREE.LineSegments): void {
    lineSegments.geometry.dispose();
    const material = lineSegments.material;
    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose());
    } else {
      material.dispose();
    }
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      } else if (child instanceof THREE.Sprite) {
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
    });
  }

  private transferChildren(from: THREE.Group, to: THREE.Group): void {
    while (from.children.length > 0) {
      to.add(from.children[0]);
    }
  }
}
