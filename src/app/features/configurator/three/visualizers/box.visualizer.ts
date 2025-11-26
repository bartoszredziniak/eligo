import * as THREE from 'three';
import { Box } from '../../../../core/models/drawer.models';
import { BoxMeshPool } from '../utils/box-mesh.pool';
import { ThreeFactoryService } from '../services/three-factory.service';

export class BoxVisualizer {
  private pool: BoxMeshPool;

  constructor(scene: THREE.Scene, factory: ThreeFactoryService) {
    this.pool = new BoxMeshPool(scene, factory);
  }

  update(boxes: Box[], selectedId: string | null): void {
    this.pool.updateBoxes(boxes, selectedId);
  }

  dispose(): void {
    this.pool.dispose();
  }
}
