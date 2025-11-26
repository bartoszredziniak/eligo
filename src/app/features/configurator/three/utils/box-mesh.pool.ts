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
    // We cannot use scaling for hollow boxes because wall thickness would scale.
    // We must recreate the object if dimensions change.
    // However, checking if dimensions changed is optimization.
    // For now, let's just recreate it or update it.
    
    // Since we are using a Group now (returned as Mesh from factory), we can't just set scale.
    // Actually, we should probably replace the object in the scene?
    // But BoxMeshPool manages a pool of objects.
    
    // If we want to keep the pool working, we need to be able to update the geometry of the existing object.
    // But the existing object is a Group of 5 meshes.
    // Updating 5 geometries is tedious.
    
    // Simpler approach for now:
    // Dispose the old children and create new ones.
    
    const group = mesh as unknown as THREE.Group;
    
    // Clear existing children (except highlight if we want to keep it separate, but highlight is also a child)
    // Actually highlight is added to the mesh.
    
    // Let's remove all children that are parts of the box.
    // We can tag them? Or just clear all and re-add highlight.
    
    // Dispose old geometries
    group.children.forEach(c => {
        if (c.name !== 'highlight' && (c as THREE.Mesh).geometry) {
            (c as THREE.Mesh).geometry.dispose();
        }
    });
    
    // Remove all children
    group.clear();
    
    // Re-create parts
    // We can use the factory to create a new group and steal its children.
    const newGroup = this.factory.createHollowBoxGroup(box.width, box.height, box.depth, box.color);
    
    while(newGroup.children.length > 0) {
        const child = newGroup.children[0];
        group.add(child);
    }
    
    // Position
    // The group pivot is at 0,0,0 (center of box floor).
    // We need to position it at box.x + width/2, 0, box.y + depth/2
    group.position.set(
      box.x + box.width / 2,
      0, // Pivot is at bottom
      box.y + box.depth / 2
    );
    
    // Store dimensions in userData for InteractionManager
    group.userData['boxId'] = box.id;
    group.userData['width'] = box.width;
    group.userData['depth'] = box.depth;

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
      // Since the parent mesh is NOT scaled (scale is 1,1,1), we need to create highlight with actual dimensions.
      
      const highlight = this.factory.createSelectionHighlight(box.width, box.height, box.depth);
      highlight.name = 'highlight';
      // Center the highlight. Box pivot is bottom-center.
      // Highlight geometry is centered.
      highlight.position.set(0, box.height / 2, 0);
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
