import { Injectable, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { BoxColor, BOX_COLORS } from '../../../../core/models/drawer.models';
import { BOX_WALL_THICKNESS, HandleSide } from '../constants';

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
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xd4a574, // warm wood tone
      roughness: 0.6,
      metalness: 0.0
    });
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

    // Create geometries with more segments for smoother appearance
    // This gives a subtle rounded/beveled edge effect
    const floor = this.createWallMesh(
      new THREE.BoxGeometry(width, BOX_WALL_THICKNESS, depth, 2, 1, 2),
      material
    );
    floor.position.set(0, BOX_WALL_THICKNESS / 2, 0);
    group.add(floor);

    const left = this.createWallMesh(
      new THREE.BoxGeometry(BOX_WALL_THICKNESS, height, depth, 1, 2, 2),
      material
    );
    left.position.set(-width / 2 + BOX_WALL_THICKNESS / 2, height / 2, 0);
    group.add(left);

    const right = this.createWallMesh(
      new THREE.BoxGeometry(BOX_WALL_THICKNESS, height, depth, 1, 2, 2),
      material
    );
    right.position.set(width / 2 - BOX_WALL_THICKNESS / 2, height / 2, 0);
    group.add(right);

    const front = this.createWallMesh(
      new THREE.BoxGeometry(width - 2 * BOX_WALL_THICKNESS, height, BOX_WALL_THICKNESS, 2, 2, 1),
      material
    );
    front.position.set(0, height / 2, depth / 2 - BOX_WALL_THICKNESS / 2);
    group.add(front);

    const back = this.createWallMesh(
      new THREE.BoxGeometry(width - 2 * BOX_WALL_THICKNESS, height, BOX_WALL_THICKNESS, 2, 2, 1),
      material
    );
    back.position.set(0, height / 2, -depth / 2 + BOX_WALL_THICKNESS / 2);
    group.add(back);

    return group;
  }

  getBoxMaterial(color: BoxColor): THREE.MeshStandardMaterial {
    if (!this.materials.has(color)) {
      const colorDef = BOX_COLORS.find((c) => c.value === color);
      const hex = colorDef ? colorDef.hex : '#ffffff';
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(hex),
        roughness: 0.4,
        metalness: 0.2,
      });
      this.materials.set(color, material);
    }
    return this.materials.get(color) as THREE.MeshStandardMaterial;
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

  createResizeHandle(side: HandleSide): THREE.Mesh {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const size = 128; // Increased resolution
    canvas.width = size;
    canvas.height = size;

    if (context) {
      // Draw circle background with shadow effect
      const center = size / 2;
      const radius = size / 2 - 4;

      context.shadowColor = 'rgba(0, 0, 0, 0.2)';
      context.shadowBlur = 4;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 2;

      context.beginPath();
      context.arc(center, center, radius, 0, 2 * Math.PI);
      context.fillStyle = '#ffffff';
      context.fill();
      
      // Reset shadow for stroke
      context.shadowColor = 'transparent';
      context.lineWidth = 3;
      context.strokeStyle = '#e5e7eb'; // light gray border
      context.stroke();

      // Draw arrows
      context.fillStyle = '#3b82f6'; // Primary blue
      
      context.save();
      context.translate(center, center);

      // Rotate based on side
      if (side === HandleSide.TOP || side === HandleSide.BOTTOM) {
        context.rotate(Math.PI / 2);
      }

      // Draw filled double arrow
      const arrowLength = 24;
      const arrowWidth = 16;
      const stemWidth = 6;
      const stemLength = 12;

      context.beginPath();
      
      // Left Arrow
      context.moveTo(-stemLength, -stemWidth/2); // Top of stem start
      context.lineTo(-stemLength, -arrowWidth/2); // Top of arrow base
      context.lineTo(-arrowLength - stemLength, 0); // Tip
      context.lineTo(-stemLength, arrowWidth/2); // Bottom of arrow base
      context.lineTo(-stemLength, stemWidth/2); // Bottom of stem start
      
      // Right Arrow
      context.lineTo(stemLength, stemWidth/2); // Bottom of stem end
      context.lineTo(stemLength, arrowWidth/2); // Bottom of arrow base
      context.lineTo(arrowLength + stemLength, 0); // Tip
      context.lineTo(stemLength, -arrowWidth/2); // Top of arrow base
      context.lineTo(stemLength, -stemWidth/2); // Top of stem end
      
      context.closePath();
      context.fill();
      
      context.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    
    const material = new THREE.MeshBasicMaterial({ 
      map: texture, 
      depthTest: false, 
      depthWrite: false,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Use PlaneGeometry instead of Sprite
    const geometry = new THREE.PlaneGeometry(24, 24);
    const mesh = new THREE.Mesh(geometry, material);
    
    // Rotate to lie flat on XZ plane
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 999;
    
    return mesh;
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

  createLabelMesh(text: string, maxWidth: number, maxDepth: number, boxColor: BoxColor): THREE.Mesh | null {
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
    
    // Determine text color based on box color
    const hexColor = this.getBoxMaterial(boxColor).color.getHexString();
    context.fillStyle = this.getContrastColor(hexColor);
    
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
      depthTest: false, // Disable depth testing so labels always render on top
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4
    });

    // Calculate plane size in world units (mm)
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
    mesh.renderOrder = 1000; // High renderOrder ensures labels render on top
    
    // Cleanup function attached to mesh for disposal
    mesh.userData['dispose'] = () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };

    return mesh;
  }

  private getContrastColor(hex: string): string {
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Return black or white based on luminance
    return (yiq >= 128) ? '#000000' : '#ffffff';
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
