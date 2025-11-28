import * as THREE from 'three';
import { DrawerConfig } from '../../../../core/models/drawer.models';
import { ThreeFactoryService } from '../services/three-factory.service';
import { GridVisualizer } from './grid.visualizer';
import { GridService } from '../../../../core/services/grid.service';
import { DRAWER_WALL_THICKNESS } from '../constants';

export class DrawerVisualizer {
  private floor: THREE.Mesh | null = null;
  private walls: THREE.Group | null = null;
  private gridVisualizer: GridVisualizer;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly factory: ThreeFactoryService,
    private readonly gridService: GridService
  ) {
    this.gridVisualizer = new GridVisualizer(scene);
  }

  update(config: DrawerConfig): void {
    this.updateFloor(config);
    this.updateWalls(config);
    this.updateGrid(config);
  }

  dispose(): void {
    this.disposeFloor();
    this.disposeWalls();
    this.gridVisualizer.dispose();
  }

  private updateFloor(config: DrawerConfig): void {
    this.disposeFloor();

    this.floor = this.factory.createDrawerFloor(config.width, config.depth);
    this.floor.position.set(config.width / 2, 0, config.depth / 2);
    this.scene.add(this.floor);
  }

  private updateWalls(config: DrawerConfig): void {
    this.disposeWalls();

    this.walls = new THREE.Group();

    const backWall = this.factory.createDrawerWall(
      config.width + 2 * DRAWER_WALL_THICKNESS,
      config.height,
      DRAWER_WALL_THICKNESS
    );
    backWall.position.set(config.width / 2, config.height / 2, -DRAWER_WALL_THICKNESS / 2);
    this.walls.add(backWall);

    const leftWall = this.factory.createDrawerWall(
      DRAWER_WALL_THICKNESS,
      config.height,
      config.depth
    );
    leftWall.position.set(-DRAWER_WALL_THICKNESS / 2, config.height / 2, config.depth / 2);
    this.walls.add(leftWall);

    const rightWall = this.factory.createDrawerWall(
      DRAWER_WALL_THICKNESS,
      config.height,
      config.depth
    );
    rightWall.position.set(
      config.width + DRAWER_WALL_THICKNESS / 2,
      config.height / 2,
      config.depth / 2
    );
    this.walls.add(rightWall);

    const frontWall = this.factory.createDrawerWall(
      config.width + 2 * DRAWER_WALL_THICKNESS,
      config.height,
      DRAWER_WALL_THICKNESS
    );
    frontWall.position.set(
      config.width / 2,
      config.height / 2,
      config.depth + DRAWER_WALL_THICKNESS / 2
    );
    this.walls.add(frontWall);

    this.scene.add(this.walls);
  }

  private updateGrid(config: DrawerConfig): void {
    const gridLayout = this.gridService.gridLayout();
    const cellSize = this.gridService.cellSize();
    this.gridVisualizer.update(config, gridLayout, cellSize);
  }

  private disposeFloor(): void {
    if (this.floor) {
      this.scene.remove(this.floor);
      this.floor.geometry.dispose();
      this.floor = null;
    }
  }

  private disposeWalls(): void {
    if (this.walls) {
      this.scene.remove(this.walls);
      this.walls.children.forEach((child) => {
        (child as THREE.Mesh).geometry.dispose();
      });
      this.walls = null;
    }
  }
}
