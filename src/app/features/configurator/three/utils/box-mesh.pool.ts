import * as THREE from 'three';
import { Box, BoxColor } from '../../../../core/models/drawer.models';
import { ThreeFactoryService } from '../services/three-factory.service';
import { GridService } from '../../../../core/services/grid.service';
import { USER_DATA_KEYS } from '../constants';

export class BoxMeshPool {
  private available: THREE.Mesh[] = [];
  private inUse: Map<string, THREE.Mesh> = new Map<string, THREE.Mesh>();

  constructor(
    private readonly scene: THREE.Scene,
    private readonly factory: ThreeFactoryService,
    private readonly gridService: GridService
  ) {}

  updateBoxes(boxes: Box[], selectedId: string | null, collisions: Set<string>): void {
    const newIds = new Set(boxes.map((b) => b.id));

    this.removeUnusedBoxes(newIds);
    this.createOrUpdateBoxes(boxes, selectedId, collisions);
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

  private createOrUpdateBoxes(boxes: Box[], selectedId: string | null, collisions: Set<string>): void {
    for (const box of boxes) {
      let mesh = this.inUse.get(box.id);
      const isSelected = box.id === selectedId;
      const isInvalid = collisions.has(box.id);

      if (!mesh) {
        mesh = this.acquire();
        this.inUse.set(box.id, mesh);
        this.scene.add(mesh);
        mesh.userData[USER_DATA_KEYS.BOX_ID] = box.id;
        // Force full update for new mesh
        this.updateMesh(mesh, box, isSelected, isInvalid);
      } else {
        // Check if full update is needed
        const coords = this.gridService.convertBoxToMm(box);
        const prevWidth = mesh.userData[USER_DATA_KEYS.WIDTH];
        const prevDepth = mesh.userData[USER_DATA_KEYS.DEPTH];
        // We also need to check height if it can change, but currently it's fixed or part of box data
        // Let's assume height is derived from box data which might change. 
        // But userData only stores width/depth. Let's rely on Box object comparison or just coords.
        // Ideally we store all dimensions in userData to compare.
        
        // For now, let's check if dimensions or color changed.
        // We can store the previous box state hash or properties.
        
        // Simplified check: if dimensions match, just update position and visual state
        // But color change requires full rebuild of children materials? 
        // Actually createHollowBoxGroup uses color to pick material.
        
        // Let's just do full update for now as "Optimization" step in plan was about avoiding geometry rebuilds.
        // But to properly implement the optimization we need to track state.
        
        // Let's implement a smart update:
        // 1. Position always updates.
        // 2. Visual state (highlight/error) updates via updateVisualState.
        // 3. Geometry/Material only updates if dimensions/color change.
        
        // To do this robustly without complex state tracking on mesh, let's just use the "full update" 
        // but optimize inside updateMesh to reuse geometry if possible? 
        // The factory creates new geometry every time.
        
        // Let's stick to the plan: "Refactor updateMesh to avoid rebuilding geometry if dimensions/color haven't changed."
        
        // We need to store color in userData to check for changes.
        const prevColor = mesh.userData['boxColor'];
        
        // Check if geometry needs rebuild
        if (
          Math.abs(prevWidth - coords.width) < 0.01 &&
          Math.abs(prevDepth - coords.depth) < 0.01 &&
          // We need height check too. Let's add height to userData.
          // For now assuming height doesn't change often or we just rebuild.
          prevColor === box.color
        ) {
           // Geometry and color same, just update position and visual overlays
           mesh.position.set(coords.x + coords.width / 2, 0, coords.y + coords.depth / 2);
           this.updateVisualState(mesh, coords.width, coords.height, coords.depth, isSelected, isInvalid);
        } else {
           this.updateMesh(mesh, box, isSelected, isInvalid);
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

  private updateMesh(mesh: THREE.Mesh, box: Box, isSelected: boolean, isInvalid: boolean): void {
    const group = mesh as unknown as THREE.Group;

    this.disposeGeometries(group.children.filter((c) => c.name !== USER_DATA_KEYS.HIGHLIGHT));
    group.clear();

    // Convert grid units to mm for 3D rendering using helper
    const coords = this.gridService.convertBoxToMm(box);

    const newGroup = this.factory.createHollowBoxGroup(coords.width, coords.height, coords.depth, box.color);
    this.transferChildren(newGroup, group);

    // Position using mm coordinates
    group.position.set(coords.x + coords.width / 2, 0, coords.y + coords.depth / 2);

    group.userData[USER_DATA_KEYS.BOX_ID] = box.id;
    group.userData[USER_DATA_KEYS.WIDTH] = coords.width;
    group.userData[USER_DATA_KEYS.DEPTH] = coords.depth;
    group.userData['boxColor'] = box.color;

    this.updateVisualState(mesh, coords.width, coords.height, coords.depth, isSelected, isInvalid);
  }

  private updateVisualState(
    mesh: THREE.Mesh,
    widthMm: number,
    heightMm: number,
    depthMm: number,
    isSelected: boolean,
    isInvalid: boolean
  ): void {
    // Handle Selection Highlight
    this.handleHighlight(mesh, widthMm, heightMm, depthMm, isSelected);

    // Handle Error State (Red Color Overlay or Material Swap)
    // Since we are using a Group with children meshes for walls, we can traverse and swap materials.
    // But we need to restore original material if valid.
    // The factory returns meshes with shared materials from a map.
    
    const group = mesh as unknown as THREE.Group;
    group.children.forEach((child) => {
      if (child.name === USER_DATA_KEYS.HIGHLIGHT) return;
      
      const meshChild = child as THREE.Mesh;
      if (isInvalid) {
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
      highlight.position.set(0, heightMm / 2, 0);
      mesh.add(highlight);
    }
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

  private transferChildren(from: THREE.Group, to: THREE.Group): void {
    while (from.children.length > 0) {
      to.add(from.children[0]);
    }
  }
}
