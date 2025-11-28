import { Injectable, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { BoxColor, BOX_COLORS } from '../../../../core/models/drawer.models';
import { BOX_WALL_THICKNESS } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class ThreeFactoryService implements OnDestroy {
  private materials: Map<string, THREE.Material> = new Map<string, THREE.Material>();

  createDrawerFloor(width: number, depth: number): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, depth);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    return mesh;
  }

  createDrawerWall(width: number, height: number, depth: number): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  createBoxMesh(width: number, height: number, depth: number, color: BoxColor): THREE.Mesh {
    const group = this.createHollowBoxGroup(width, height, depth, color);
    return group as unknown as THREE.Mesh;
  }

  createHollowBoxGroup(width: number, height: number, depth: number, color: BoxColor): THREE.Group {
    const group = new THREE.Group();
    const material = this.getBoxMaterial(color);

    const floor = this.createWallMesh(
      new THREE.BoxGeometry(width, BOX_WALL_THICKNESS, depth),
      material
    );
    floor.position.set(0, BOX_WALL_THICKNESS / 2, 0);
    group.add(floor);

    const left = this.createWallMesh(
      new THREE.BoxGeometry(BOX_WALL_THICKNESS, height, depth),
      material
    );
    left.position.set(-width / 2 + BOX_WALL_THICKNESS / 2, height / 2, 0);
    group.add(left);

    const right = this.createWallMesh(
      new THREE.BoxGeometry(BOX_WALL_THICKNESS, height, depth),
      material
    );
    right.position.set(width / 2 - BOX_WALL_THICKNESS / 2, height / 2, 0);
    group.add(right);

    const front = this.createWallMesh(
      new THREE.BoxGeometry(width - 2 * BOX_WALL_THICKNESS, height, BOX_WALL_THICKNESS),
      material
    );
    front.position.set(0, height / 2, depth / 2 - BOX_WALL_THICKNESS / 2);
    group.add(front);

    const back = this.createWallMesh(
      new THREE.BoxGeometry(width - 2 * BOX_WALL_THICKNESS, height, BOX_WALL_THICKNESS),
      material
    );
    back.position.set(0, height / 2, -depth / 2 + BOX_WALL_THICKNESS / 2);
    group.add(back);

    return group;
  }

  getBoxMaterial(color: BoxColor): THREE.Material {
    if (!this.materials.has(color)) {
      const colorDef = BOX_COLORS.find((c) => c.value === color);
      const hex = colorDef ? colorDef.hex : '#ffffff';
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(hex),
        roughness: 0.7,
        metalness: 0.1,
      });
      this.materials.set(color, material);
    }
    return this.materials.get(color)!;
  }

  getErrorMaterial(): THREE.Material {
    const key = 'error-material';
    if (!this.materials.has(key)) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.7,
        metalness: 0.1,
      });
      this.materials.set(key, material);
    }
    return this.materials.get(key)!;
  }

  createSelectionHighlight(width: number, height: number, depth: number): THREE.LineSegments {
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));
    const material = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
    return new THREE.LineSegments(geometry, material);
  }

  ngOnDestroy(): void {
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
  }

  private createWallMesh(geometry: THREE.BoxGeometry, material: THREE.Material): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}
