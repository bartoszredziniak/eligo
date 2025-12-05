import * as THREE from 'three';
import { Box } from '../../../../core/models/drawer.models';
import { BoxValidationError } from '../../../../core/models/validation.models';
import { BoxMeshPool } from '../utils/box-mesh.pool';
import { ThreeFactoryService } from '../services/three-factory.service';
import { GridService } from '../../../../core/services/grid.service';

export class BoxVisualizer {
  private pool: BoxMeshPool;

  constructor(
    scene: THREE.Scene,
    factory: ThreeFactoryService,
    gridService: GridService
  ) {
    this.pool = new BoxMeshPool(scene, factory, gridService);
  }

  update(boxes: Box[], selectedId: string | null, errors: BoxValidationError[], showLabels: boolean = true): void {
    this.pool.updateBoxes(boxes, selectedId, errors, showLabels);
  }

  dispose(): void {
    this.pool.dispose();
  }
}
