import * as THREE from 'three';
import { Box } from '../../../../core/models/drawer.models';
import { ThreeFactoryService } from '../services/three-factory.service';

export class BoxMeshPool {
  private available: THREE.Mesh[] = [];
  private inUse: Map<string, THREE.Mesh> = new Map<string, THREE.Mesh>();

  constructor(
    private readonly scene: THREE.Scene,
    private readonly factory: ThreeFactoryService
  ) {}

  updateBoxes(boxes: Box[], selectedId: string | null): void {
    const newIds = new Set(boxes.map((b) => b.id));

    // 1. Remove boxes that are no longer in the list
    for (const [id, mesh] of this.inUse.entries()) {
      if (!newIds.has(id)) {
        this.release(id, mesh);
      }
    }

    // 2. Create or update boxes
    for (const box of boxes) {
      let mesh = this.inUse.get(box.id);

      if (!mesh) {
        mesh = this.acquire();
        this.inUse.set(box.id, mesh);
        this.scene.add(mesh);
        // Store ID in userData for raycasting
        mesh.userData['boxId'] = box.id;
      }

      this.updateMesh(mesh, box, box.id === selectedId);
    }
  }

  private acquire(): THREE.Mesh {
    if (this.available.length > 0) {
      const mesh = this.available.pop()!;
      mesh.visible = true;
      return mesh;
    }
    // Create a default mesh if pool is empty (will be updated immediately)
    return this.factory.createBoxMesh(1, 1, 1, 'white');
  }

  private release(id: string, mesh: THREE.Mesh): void {
    mesh.visible = false;
    this.scene.remove(mesh);
    this.inUse.delete(id);
    this.available.push(mesh);
  }

  private updateMesh(mesh: THREE.Mesh, box: Box, isSelected: boolean): void {
    // Optimization: Use scaling instead of recreating geometry
    // The base geometry should be 1x1x1 (created in factory)
    
    mesh.scale.set(box.width, box.height, box.depth);
    
    mesh.material = this.factory.getBoxMaterial(box.color);
    
    // Position
    // Since geometry is 1x1x1 centered at 0,0,0:
    // - Scaling expands it from center.
    // - We need to position the center correctly.
    
    mesh.position.set(
      box.x + box.width / 2,
      box.height / 2, // On the floor
      box.y + box.depth / 2
    );

    // Highlight
    this.handleHighlight(mesh, box, isSelected);
  }

  private handleHighlight(mesh: THREE.Mesh, box: Box, isSelected: boolean): void {
    // Remove existing highlight
    const existingHighlight = mesh.children.find(c => c.name === 'highlight');
    if (existingHighlight) {
      mesh.remove(existingHighlight);
      (existingHighlight as THREE.LineSegments).geometry.dispose();
      const material = (existingHighlight as THREE.LineSegments).material;
      if (Array.isArray(material)) {
        material.forEach(m => m.dispose());
      } else {
        material.dispose();
      }
    }

    if (isSelected) {
      // Highlight needs to match the box dimensions.
      // Since the parent mesh is scaled, the child (highlight) will inherit the scale!
      // So we should create a 1x1x1 highlight and let it be scaled by parent.
      
      const highlight = this.factory.createSelectionHighlight(1, 1, 1);
      highlight.name = 'highlight';
      mesh.add(highlight);
    }
  }
  
  dispose(): void {
      this.available.forEach(m => {
          m.geometry.dispose();
          // Material is shared, don't dispose here
      });
      this.inUse.forEach(m => {
          m.geometry.dispose();
      });
      this.available = [];
      this.inUse.clear();
  }
}
