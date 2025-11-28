import * as THREE from 'three';
import { Box } from '../../../../core/models/drawer.models';
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

  updateBoxes(boxes: Box[], selectedId: string | null): void {
    const newIds = new Set(boxes.map((b) => b.id));

    this.removeUnusedBoxes(newIds);
    this.createOrUpdateBoxes(boxes, selectedId);
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

  private createOrUpdateBoxes(boxes: Box[], selectedId: string | null): void {
    for (const box of boxes) {
      let mesh = this.inUse.get(box.id);

      if (!mesh) {
        mesh = this.acquire();
        this.inUse.set(box.id, mesh);
        this.scene.add(mesh);
        mesh.userData[USER_DATA_KEYS.BOX_ID] = box.id;
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
    return this.factory.createBoxMesh(1, 1, 1, 'white');
  }

  private release(id: string, mesh: THREE.Mesh): void {
    mesh.visible = false;
    this.scene.remove(mesh);
    this.inUse.delete(id);
    this.available.push(mesh);
  }

  private updateMesh(mesh: THREE.Mesh, box: Box, isSelected: boolean): void {
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

    this.handleHighlight(mesh, coords.width, coords.height, coords.depth, isSelected);
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
