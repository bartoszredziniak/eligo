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

  createLabelSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const size = 128; // Higher resolution
    canvas.width = size;
    canvas.height = size;

    if (context) {
      // Draw circle background
      context.beginPath();
      context.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
      context.fillStyle = '#ffffff';
      context.fill();
      context.lineWidth = 4;
      context.strokeStyle = '#000000';
      context.stroke();

      // Draw text
      context.font = 'bold 80px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = '#000000';
      context.fillText(text, size / 2, size / 2 + 5); // Slight offset for visual centering
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(60, 60, 1); // Size in world units
    sprite.renderOrder = 999; // Ensure it renders on top
    return sprite;
  }

  createLabelMesh(text: string, maxWidth: number, maxDepth: number): THREE.Mesh | null {
    if (!text) return null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return null;

    // High resolution for crisp text
    const fontSize = 48;
    const font = `bold ${fontSize}px Arial`;
    context.font = font;
    
    const textMetrics = context.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize * 1.4; // Line height

    // Add padding
    const padding = 20;
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // Clear and draw
    context.fillStyle = 'rgba(0,0,0,0)'; // Transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    context.font = font;
    context.fillStyle = '#000000'; // Black text
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false, // Don't write to depth buffer to avoid z-fighting issues with transparent objects
      polygonOffset: true,
      polygonOffsetFactor: -2, // Pull towards camera significantly
      polygonOffsetUnits: -2
    });

    // Calculate plane size in world units (mm)
    // We want the text to be legible but fit within the box
    // Let's say 48px font corresponds to roughly 12mm height in world space
    const pixelToMmRatio = 0.25; 
    const planeWidth = canvas.width * pixelToMmRatio;
    const planeHeight = canvas.height * pixelToMmRatio;

    // Check if it fits
    const scale = Math.min(
      1,
      (maxWidth * 0.9) / planeWidth,
      (maxDepth * 0.9) / planeHeight
    );

    const geometry = new THREE.PlaneGeometry(planeWidth * scale, planeHeight * scale);
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.name = 'label';
    mesh.rotation.x = -Math.PI / 2;
    
    // Cleanup function attached to mesh for disposal
    mesh.userData['dispose'] = () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };

    return mesh;
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
