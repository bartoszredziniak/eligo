import { Injectable, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { BoxColor, BOX_COLORS } from '../../../../core/models/drawer.models';
import { BOX_WALL_THICKNESS } from '../constants';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

@Injectable({
  providedIn: 'root',
})
export class ThreeFactoryService implements OnDestroy {
  private materials: Map<string, THREE.Material> = new Map<string, THREE.Material>();

  createDrawerFloor(width: number, depth: number): THREE.Mesh {
    const thickness = 10;
    const geometry = new RoundedBoxGeometry(width, thickness, depth, 4, 2); 
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xe5e1da, // unified with walls
      roughness: 0.6,
      metalness: 0.05,
      clearcoat: 0.1
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -thickness / 2; // Surface will be at y=0
    mesh.receiveShadow = true;
    return mesh;
  }

  createDrawerWall(width: number, height: number, depth: number): THREE.Mesh {
    const geometry = new RoundedBoxGeometry(width, height, depth, 4, 3);
    const material = new THREE.MeshPhysicalMaterial({ 
      color: 0xe5e1da, // softer, more neutral linen/wood tone
      roughness: 0.4,
      metalness: 0.0,
      clearcoat: 0.2
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
    const radius = 4; // Outer corner radius
    const wallThickness = BOX_WALL_THICKNESS;
    const floorThickness = wallThickness;

    // 1. Create the wall shell (one single piece "O" shape)
    const wallShape = this.createRoundedRectShape(width, depth, radius);
    
    // Create the hole for the inside
    const holePath = this.createRoundedRectShape(
      width - 2 * wallThickness, 
      depth - 2 * wallThickness, 
      Math.max(0, radius - wallThickness)
    );
    wallShape.holes.push(holePath);

    const wallGeometry = new THREE.ExtrudeGeometry(wallShape, {
      depth: height - floorThickness,
      bevelEnabled: true,
      bevelThickness: 1.5,
      bevelSize: 1.5,
      bevelSegments: 4,
    });
    
    const wallsMesh = new THREE.Mesh(wallGeometry, material);
    wallsMesh.rotation.x = -Math.PI / 2;
    wallsMesh.position.y = floorThickness; // Start exactly where floor ends
    wallsMesh.castShadow = true;
    wallsMesh.receiveShadow = true;
    group.add(wallsMesh);

    // 2. Create the floor using ExtrudeGeometry for consistent rounded look
    const floorShape = this.createRoundedRectShape(width, depth, radius);
    const floorGeometry = new THREE.ExtrudeGeometry(floorShape, {
      depth: floorThickness,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 1,
      bevelSegments: 3,
    });
    
    const floorMesh = new THREE.Mesh(floorGeometry, material);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = floorThickness; // Positioned so its top is at y=floorThickness
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    group.add(floorMesh);

    return group;
  }

  private createRoundedRectShape(width: number, depth: number, radius: number): THREE.Shape {
    const shape = new THREE.Shape();
    const x = -width / 2;
    const y = -depth / 2;

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + depth - radius);
    shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth);
    shape.lineTo(x + radius, y + depth);
    shape.quadraticCurveTo(x, y + depth, x, y + depth - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);

    return shape;
  }

  getBoxMaterial(color: BoxColor): THREE.MeshPhysicalMaterial {
    if (!this.materials.has(color)) {
      const colorDef = BOX_COLORS.find((c) => c.value === color);
      const hex = colorDef ? colorDef.hex : '#ffffff';
      const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(hex),
        roughness: 0.2, // smoother plastic
        metalness: 0,
        clearcoat: 0.8, // high quality molded coating
        clearcoatRoughness: 0.1,
        reflectivity: 0.5,
      });
      this.materials.set(color, material);
    }
    return this.materials.get(color) as THREE.MeshPhysicalMaterial;
  }

  getErrorMaterial(): THREE.Material {
    const key = 'error-material';
    if (!this.materials.has(key)) {
      const material = new THREE.MeshStandardMaterial({
        color: 0xff3b30, // Brighter red
        roughness: 0.7,
        metalness: 0.1,
      });
      this.materials.set(key, material);
    }
    return this.materials.get(key)!;
  }

  createSelectionHighlight(width: number, height: number, depth: number): THREE.LineSegments {
    // Offset slightly to avoid z-fighting with edges
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width + 1, height + 1, depth + 1));
    const material = new THREE.LineBasicMaterial({ 
      color: 0x3b82f6, 
      linewidth: 2,
      depthTest: false, // Always visible on top
      depthWrite: false
    });
    const line = new THREE.LineSegments(geometry, material);
    line.position.y = height / 2; // Offset so bottom of highlight is at y=0
    line.renderOrder = 3999;
    return line;
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

  createResizeHandleMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'handle';

    // Outer shell (Semi-transparent glow/border)
    // Radius 22mm
    const outerGeometry = new THREE.SphereGeometry(22, 16, 16);
    const outerMaterial = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x2563eb,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.4,
      depthTest: false,
      depthWrite: false
    });
    const outer = new THREE.Mesh(outerGeometry, outerMaterial);
    outer.renderOrder = 3000;
    group.add(outer);

    // Inner core (Solid "button" look)
    // Radius 14mm
    const innerGeometry = new THREE.SphereGeometry(14, 16, 16);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.8,
      depthTest: false,
      depthWrite: false
    });
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    inner.renderOrder = 3001; // Always on top of outer
    group.add(inner);

    return group;
  }

  private createWallMesh(geometry: THREE.BoxGeometry, material: THREE.Material): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}
