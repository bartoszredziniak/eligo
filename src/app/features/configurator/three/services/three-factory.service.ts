import { Injectable, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { BoxColor, BOX_COLORS } from '../../../../core/models/drawer.models';

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
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = this.getBoxMaterial(color);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
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

  createSelectionHighlight(width: number, height: number, depth: number): THREE.LineSegments {
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));
    const material = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
    return new THREE.LineSegments(geometry, material);
  }

  ngOnDestroy(): void {
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
  }
}
