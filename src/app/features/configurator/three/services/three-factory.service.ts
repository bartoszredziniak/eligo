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
    const group = this.createHollowBoxGroup(width, height, depth, color);
    return group as unknown as THREE.Mesh;
  }

  createHollowBoxGroup(width: number, height: number, depth: number, color: BoxColor): THREE.Group {
    const group = new THREE.Group();
    const material = this.getBoxMaterial(color);
    const t = 2;

    // Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(width, t, depth), material);
    floor.position.set(0, t/2, 0);
    floor.castShadow = true;
    floor.receiveShadow = true;
    group.add(floor);

    // Left
    const left = new THREE.Mesh(new THREE.BoxGeometry(t, height, depth), material);
    left.position.set(-width/2 + t/2, height/2, 0);
    left.castShadow = true;
    left.receiveShadow = true;
    group.add(left);

    // Right
    const right = new THREE.Mesh(new THREE.BoxGeometry(t, height, depth), material);
    right.position.set(width/2 - t/2, height/2, 0);
    right.castShadow = true;
    right.receiveShadow = true;
    group.add(right);

    // Front
    const front = new THREE.Mesh(new THREE.BoxGeometry(width - 2*t, height, t), material);
    front.position.set(0, height/2, depth/2 - t/2);
    front.castShadow = true;
    front.receiveShadow = true;
    group.add(front);

    // Back
    const back = new THREE.Mesh(new THREE.BoxGeometry(width - 2*t, height, t), material);
    back.position.set(0, height/2, -depth/2 + t/2);
    back.castShadow = true;
    back.receiveShadow = true;
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
