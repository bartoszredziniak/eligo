import * as THREE from 'three';
import { DrawerConfig } from '../../../../core/models/drawer.models';
import { ThreeFactoryService } from '../services/three-factory.service';

export class DrawerVisualizer {
  private floor: THREE.Mesh | null = null;
  private walls: THREE.Group | null = null;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly factory: ThreeFactoryService
  ) {}

  update(config: DrawerConfig): void {
    this.updateFloor(config);
    this.updateWalls(config);
  }

  private updateFloor(config: DrawerConfig): void {
    if (this.floor) {
      this.scene.remove(this.floor);
      this.floor.geometry.dispose();
      // Material is shared
    }

    this.floor = this.factory.createDrawerFloor(config.width, config.depth);
    // Center the floor
    this.floor.position.set(config.width / 2, 0, config.depth / 2);
    this.scene.add(this.floor);
  }

  private updateWalls(config: DrawerConfig): void {
    if (this.walls) {
      this.scene.remove(this.walls);
      this.walls.children.forEach((child) => {
        (child as THREE.Mesh).geometry.dispose();
      });
    }

    this.walls = new THREE.Group();
    const thickness = 16; // 16mm walls

    // Back Wall
    const backWall = this.factory.createDrawerWall(config.width, config.height, thickness);
    backWall.position.set(config.width / 2, config.height / 2, -thickness / 2);
    this.walls.add(backWall);

    // Left Wall
    const leftWall = this.factory.createDrawerWall(thickness, config.height, config.depth);
    leftWall.position.set(-thickness / 2, config.height / 2, config.depth / 2);
    this.walls.add(leftWall);

    // Right Wall
    const rightWall = this.factory.createDrawerWall(thickness, config.height, config.depth);
    rightWall.position.set(config.width + thickness / 2, config.height / 2, config.depth / 2);
    this.walls.add(rightWall);

    // Front Wall
    const frontWall = this.factory.createDrawerWall(config.width, config.height, thickness);
    frontWall.position.set(config.width / 2, config.height / 2, config.depth + thickness / 2);
    this.walls.add(frontWall);

    this.scene.add(this.walls);
  }

  dispose(): void {
    if (this.floor) {
      this.scene.remove(this.floor);
      this.floor.geometry.dispose();
    }
    if (this.walls) {
      this.scene.remove(this.walls);
      this.walls.children.forEach((child) => {
        (child as THREE.Mesh).geometry.dispose();
      });
    }
  }
}
