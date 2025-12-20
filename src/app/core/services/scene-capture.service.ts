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
    const originalBackground = scene.background;

    // Store current camera state
    const originalPosition = camera.position.clone();
    const originalRotation = camera.rotation.clone();
    const originalZoom = camera.zoom;

    // 1. Set white background for PDF
    scene.background = new THREE.Color(0xffffff);

    // 2. Switch to top-down view for PDF
    const centerX = drawerWidth / 2;
    const centerZ = drawerDepth / 2;

    camera.position.set(centerX, 1000, centerZ);
    camera.lookAt(centerX, 0, centerZ);

    // Auto-fit zoom for PDF
    const currentFrustumHeight = (camera.top - camera.bottom);
    const currentFrustumWidth = (camera.right - camera.left);
    
    const padding = 100; // mm
    const requiredWidth = drawerWidth + padding * 2;
    const requiredDepth = drawerDepth + padding * 2;

    const zoomX = currentFrustumWidth / requiredWidth;
    const zoomZ = currentFrustumHeight / requiredDepth;
    
    camera.zoom = Math.min(zoomX, zoomZ, 1); 
    camera.updateProjectionMatrix();

    // 3. Add labels for each box (always show labels for PDF)
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

    // 4. Render the scene with changes
    facade.render();

    // 5. Capture canvas
    const canvas = facade.getRenderer().domElement;
    const dataUrl = canvas.toDataURL('image/png', 0.8);

    // 6. Cleanup labels
    labels.forEach(label => {
      scene.remove(label);
      label.material.map?.dispose();
      label.material.dispose();
    });

    // 7. Restore original background
    scene.background = originalBackground;

    // 8. Restore camera
    camera.position.copy(originalPosition);
    camera.rotation.copy(originalRotation);
    camera.zoom = originalZoom; 
    camera.updateProjectionMatrix();

    // 9. Render again to restore view for user
    facade.render();

    return dataUrl;
  }
}
