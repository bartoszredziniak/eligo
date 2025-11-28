import * as THREE from 'three';
import { Subject } from 'rxjs';
import { GridService } from '../../../core/services/grid.service';
import { USER_DATA_KEYS } from './constants';

export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  private _boxSelected = new Subject<string | null>();
  boxSelected$ = this._boxSelected.asObservable();

  private _boxDrag = new Subject<{ id: string; x: number; y: number }>();
  boxDrag$ = this._boxDrag.asObservable();

  private _dragStart = new Subject<void>();
  dragStart$ = this._dragStart.asObservable();

  private _dragEnd = new Subject<void>();
  dragEnd$ = this._dragEnd.asObservable();

  private isDragging = false;
  private draggedBoxId: string | null = null;
  private dragOffset = new THREE.Vector3();
  private drawerDimensions = { width: 0, depth: 0 };

  constructor(
    private readonly camera: THREE.Camera,
    private readonly scene: THREE.Scene,
    private readonly gridService: GridService
  ) {}

  updateDrawerDimensions(width: number, depth: number): void {
    this.drawerDimensions = { width, depth };
  }

  onPointerDown(event: MouseEvent, rect: DOMRect): void {
    this.updateMouse(event, rect);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const { boxId, boxObject, intersectionPoint } = this.findBoxByRaycast();

    if (boxId && boxObject && intersectionPoint) {
      this.startDrag(boxId, boxObject, intersectionPoint);
      this._boxSelected.next(boxId);
    } else {
      this._boxSelected.next(null);
    }
  }

  onPointerMove(event: MouseEvent, rect: DOMRect): void {
    if (!this.isDragging || !this.draggedBoxId) return;

    this.updateMouse(event, rect);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const target = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.plane, target)) return;

    target.add(this.dragOffset);

    const mesh = this.findMeshById(this.draggedBoxId);
    if (!mesh) return;

    const clampedPosition = this.calculateSnappedPosition(target, mesh);

    this._boxDrag.next({
      id: this.draggedBoxId,
      x: clampedPosition.x,
      y: clampedPosition.y,
    });
  }

  onPointerUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.draggedBoxId = null;
      this._dragEnd.next();
    }
  }

  /**
   * Calculate snapped grid position from target coordinates and mesh dimensions
   */
  private calculateSnappedPosition(
    target: THREE.Vector3,
    mesh: THREE.Object3D
  ): { x: number; y: number } {
    const { width, depth } = this.getBoxDimensions(mesh);

    // Convert mm to grid units for snapping
    const targetXGridUnits = this.gridService.mmToGridUnits(target.x - width / 2);
    const targetYGridUnits = this.gridService.mmToGridUnits(target.z - depth / 2);

    // Get box dimensions in grid units
    const widthGridUnits = this.gridService.mmToGridUnits(width);
    const depthGridUnits = this.gridService.mmToGridUnits(depth);

    // Use cached grid layout
    const gridLayout = this.gridService.gridLayout();

    // Clamp to grid bounds and return
    return {
      x: this.gridService.clampToGridBounds(targetXGridUnits, widthGridUnits, gridLayout.gridUnitsWidth),
      y: this.gridService.clampToGridBounds(targetYGridUnits, depthGridUnits, gridLayout.gridUnitsDepth),
    };
  }

  private findBoxByRaycast(): {
    boxId: string | null;
    boxObject: THREE.Object3D | null;
    intersectionPoint: THREE.Vector3 | null;
  } {
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const intersect of intersects) {
      let object: THREE.Object3D | null = intersect.object;
      while (object) {
        if (object.userData?.[USER_DATA_KEYS.BOX_ID]) {
          return {
            boxId: object.userData[USER_DATA_KEYS.BOX_ID],
            boxObject: object,
            intersectionPoint: intersect.point,
          };
        }
        object = object.parent;
      }
    }

    return { boxId: null, boxObject: null, intersectionPoint: null };
  }

  private findMeshById(id: string): THREE.Object3D | null {
    return this.scene.children.find(
      (c) => c.userData?.[USER_DATA_KEYS.BOX_ID] === id
    ) || null;
  }

  private getBoxDimensions(mesh: THREE.Object3D): { width: number; depth: number } {
    return {
      width: mesh.userData[USER_DATA_KEYS.WIDTH] || mesh.scale.x,
      depth: mesh.userData[USER_DATA_KEYS.DEPTH] || mesh.scale.z,
    };
  }

  private startDrag(
    boxId: string,
    boxObject: THREE.Object3D,
    intersectionPoint: THREE.Vector3
  ): void {
    this.isDragging = true;
    this.draggedBoxId = boxId;
    this._dragStart.next();

    const boxPos = new THREE.Vector3();
    boxObject.getWorldPosition(boxPos);
    this.dragOffset.copy(boxPos).sub(intersectionPoint);
  }

  private updateMouse(event: MouseEvent, rect: DOMRect): void {
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
}
