import { Injectable, inject } from '@angular/core';
import * as THREE from 'three';
import { ThreeFactoryService } from '../../features/configurator/three/services/three-factory.service';
import { GridService } from '../../core/services/grid.service';
import { ThreeSceneFacade } from '../../features/configurator/three/three-scene.facade';
import { Box } from '../models/drawer.models';

@Injectable({
  providedIn: 'root',
})
export class SceneCaptureService {
  private readonly factoryService = inject(ThreeFactoryService);
  private readonly gridService = inject(GridService);

  /**
   * Capture the current 3D scene as a base64 image for PDF generation
   */
  public captureScene(
    facade: ThreeSceneFacade, 
    boxes: Box[], 
    drawerWidth: number, 
    drawerDepth: number
  ): string {
    if (!facade) {
      return '';
    }

    const scene = facade.getScene();
    const camera = facade.getCamera();
    const renderer = facade.getRenderer();
    const originalBackground = scene.background;
    const originalSize = new THREE.Vector2();
    renderer.getSize(originalSize);

    // Store current camera state
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    const originalZoom = camera.zoom;

    // 1. Set white background for PDF
    scene.background = new THREE.Color(0xffffff);

    // 2. Setup Camera for Capture
    // We want to preserve the EXACT current rotation (perspective) but center the view on the drawer.
    const centerX = drawerWidth / 2;
    const centerZ = drawerDepth / 2;
    const targetCenter = new THREE.Vector3(centerX, 0, centerZ);

    // Ensure matrices are up to date before calculation
    camera.updateMatrixWorld();

    // Transform targetCenter to View Space (Camera Local Space)
    const viewCenter = targetCenter.clone().applyMatrix4(camera.matrixWorldInverse);

    // We want the targetCenter to appear at (0, 0) in the View Space (Center of screen).
    // Currently it is at (viewCenter.x, viewCenter.y).
    // We need to move the camera by (viewCenter.x, viewCenter.y) in its local Right/Up axes.
    const shiftRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const shiftUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

    camera.position.add(shiftRight.multiplyScalar(viewCenter.x));
    camera.position.add(shiftUp.multiplyScalar(viewCenter.y));

    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    // 3. Calculate Bounding Box in View Space to remove white space
    // Determine max height from boxes to ensure top corners are included
    let maxBoxHeight = 0;
    if (boxes && boxes.length > 0) {
      boxes.forEach(box => {
        const h = this.gridService.convertBoxToMm(box).height;
        if (h > maxBoxHeight) maxBoxHeight = h;
      });
    } else {
      maxBoxHeight = 150; // Default height if empty
    }

    // Define the world bounding box of the drawer content
    const boxMin = new THREE.Vector3(0, 0, 0);
    const boxMax = new THREE.Vector3(drawerWidth, maxBoxHeight, drawerDepth);

    // 8 Corners of the bounding box
    const corners = [
      new THREE.Vector3(boxMin.x, boxMin.y, boxMin.z),
      new THREE.Vector3(boxMax.x, boxMin.y, boxMin.z),
      new THREE.Vector3(boxMin.x, boxMax.y, boxMin.z),
      new THREE.Vector3(boxMax.x, boxMax.y, boxMin.z),
      new THREE.Vector3(boxMin.x, boxMin.y, boxMax.z),
      new THREE.Vector3(boxMax.x, boxMin.y, boxMax.z),
      new THREE.Vector3(boxMin.x, boxMax.y, boxMax.z),
      new THREE.Vector3(boxMax.x, boxMax.y, boxMax.z),
    ];

    // Project corners to View Space (Camera Space)
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    corners.forEach(p => {
      // Apply inverse world matrix to transform world point to camera local space
      p.applyMatrix4(camera.matrixWorldInverse);
      
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // 4. Resize Renderer to fit aspect ratio (High Resolution)
    const padding = 0.02; // 2% padding
    const aspect = contentWidth / contentHeight;
    
    // Set a high resolution width for PDF quality
    const targetWidth = 2048;
    const targetHeight = Math.round(targetWidth / aspect);

    // Resize facade (updates camera frustum aspect)
    facade.resize(targetWidth, targetHeight);

    // 5. Adjust Zoom to fit content
    const frustumHeight = 1000; // From ThreeSceneFacade constant
    const requiredHeight = contentHeight * (1 + padding);
    
    camera.zoom = frustumHeight / requiredHeight;
    camera.updateProjectionMatrix();

    // 6. Add labels
    const labels: THREE.Sprite[] = [];
    boxes.forEach((box, index) => {
      const sprite = this.factoryService.createLabelSprite(`${index + 1}`);
      const coords = this.gridService.convertBoxToMm(box);

      sprite.position.set(
        coords.x + coords.width / 2,
        coords.height + 30, 
        coords.y + coords.depth / 2
      );

      scene.add(sprite);
      labels.push(sprite);
    });

    // 7. Render
    facade.render();

    // 8. Capture
    const canvas = facade.getRenderer().domElement;
    const dataUrl = canvas.toDataURL('image/png', 0.9);

    // 9. Cleanup Labels
    labels.forEach(label => {
      scene.remove(label);
      label.material.map?.dispose();
      label.material.dispose();
    });

    // 10. Restore State
    scene.background = originalBackground;
    
    // Restore renderer size
    facade.resize(originalSize.x, originalSize.y);
    
    // Restore camera
    camera.position.copy(originalPosition);
    camera.rotation.copy(originalRotation);
    camera.zoom = originalZoom; 
    camera.updateProjectionMatrix();

    // Render for user
    facade.render();

    return dataUrl;
  }
}
