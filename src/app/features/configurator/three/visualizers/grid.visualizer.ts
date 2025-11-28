import * as THREE from 'three';
import { DrawerConfig } from '../../../../core/models/drawer.models';
import { GridLayout } from '../../../../core/models/grid.models';
import { GRID_LINE_COLOR, GRID_LINE_OPACITY } from '../constants';

/**
 * Visualizer for rendering grid lines on the drawer floor
 */
export class GridVisualizer {
  private gridLines: THREE.LineSegments | null = null;
  private gridGroup: THREE.Group | null = null;

  constructor(private readonly scene: THREE.Scene) {}

  /**
   * Update grid visualization based on drawer config and grid layout
   */
  update(drawerConfig: DrawerConfig, gridLayout: GridLayout, cellSize: number): void {
    this.dispose();

    this.gridGroup = new THREE.Group();

    // Create grid lines
    const geometry = this.createGridGeometry(gridLayout, cellSize);
    const material = new THREE.LineBasicMaterial({
      color: GRID_LINE_COLOR,
      opacity: GRID_LINE_OPACITY,
      transparent: true,
    });

    this.gridLines = new THREE.LineSegments(geometry, material);

    // Position grid with offset to center it in the drawer
    this.gridGroup.add(this.gridLines);
    this.gridGroup.position.set(
      gridLayout.offsetX,
      0.1, // Slightly above floor to prevent z-fighting
      gridLayout.offsetY
    );

    this.scene.add(this.gridGroup);
  }

  /**
   * Dispose grid visualization
   */
  dispose(): void {
    if (this.gridLines) {
      this.gridLines.geometry.dispose();
      (this.gridLines.material as THREE.Material).dispose();
      this.gridLines = null;
    }

    if (this.gridGroup) {
      this.scene.remove(this.gridGroup);
      this.gridGroup = null;
    }
  }

  /**
   * Create grid line geometry
   */
  private createGridGeometry(gridLayout: GridLayout, cellSize: number): THREE.BufferGeometry {
    const points: THREE.Vector3[] = [];

    const { totalWidthMm, totalDepthMm, gridUnitsWidth, gridUnitsDepth } = gridLayout;

    // Vertical lines (along X axis)
    for (let i = 0; i <= gridUnitsWidth; i++) {
      const x = i * cellSize;
      points.push(new THREE.Vector3(x, 0, 0));
      points.push(new THREE.Vector3(x, 0, totalDepthMm));
    }

    // Horizontal lines (along Z axis)
    for (let i = 0; i <= gridUnitsDepth; i++) {
      const z = i * cellSize;
      points.push(new THREE.Vector3(0, 0, z));
      points.push(new THREE.Vector3(totalWidthMm, 0, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }
}
