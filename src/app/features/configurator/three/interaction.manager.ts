import * as THREE from 'three';
import { Subject } from 'rxjs';
import { GridService } from '../../../core/services/grid.service';
import { USER_DATA_KEYS, HandleSide } from './constants';

export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  private _boxSelected = new Subject<string | null>();
  boxSelected$ = this._boxSelected.asObservable();

  private _boxClicked = new Subject<string>();
  boxClicked$ = this._boxClicked.asObservable();

  private _boxDrag = new Subject<{ id: string; x: number; y: number }>();
  boxDrag$ = this._boxDrag.asObservable();

  private _boxContextMenu = new Subject<{ boxId: string; event: MouseEvent }>();
  boxContextMenu$ = this._boxContextMenu.asObservable();

  private _boxResize = new Subject<{ id: string; width: number; depth: number; x: number; y: number }>();
  boxResize$ = this._boxResize.asObservable();

  private _dragStart = new Subject<void>();
  dragStart$ = this._dragStart.asObservable();

  private _dragEnd = new Subject<void>();
  dragEnd$ = this._dragEnd.asObservable();

  private isDragging = false;
  private draggedBoxId: string | null = null;
  private dragOffset = new THREE.Vector3();
  private isResizing = false;
  private resizeHandle: HandleSide | null = null;
  private initialBoxDimensions = { width: 0, depth: 0 };
  private initialBoxPosition = new THREE.Vector3();
  private initialMousePosition = new THREE.Vector3();
  private drawerDimensions = { width: 0, depth: 0 };
  private oversizedBoxIds = new Set<string>();

  constructor(
    private readonly camera: THREE.Camera,
    private readonly scene: THREE.Scene,
    private readonly gridService: GridService
  ) {}

  updateDrawerDimensions(width: number, depth: number): void {
    this.drawerDimensions = { width, depth };
  }

  setOversizedBoxes(ids: Set<string>): void {
    this.oversizedBoxIds = ids;
  }

  onPointerDown(event: MouseEvent, rect: DOMRect): void {
    this.updateMouse(event, rect);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // First check if we clicked on a handle
    const handleInfo = this.findHandleByRaycast();
    if (handleInfo) {
      // Start resize
      this.startResize(handleInfo.boxId, handleInfo.boxObject, handleInfo.handleSide);
      this._boxSelected.next(handleInfo.boxId);
      return;
    }

    const { boxId, boxObject, intersectionPoint } = this.findBoxByRaycast();

    if (boxId && boxObject && intersectionPoint) {
      // Handle Right Click (Context Menu)
      if (event.button === 2) {
        event.preventDefault();
        this._boxContextMenu.next({ boxId, event });
        return;
      }

      // Always emit click event first
      this._boxClicked.next(boxId);

      // Only allow drag if not oversized
      if (!this.oversizedBoxIds.has(boxId)) {
        this.startDrag(boxId, boxObject, intersectionPoint);
      }
      
      this._boxSelected.next(boxId);
    } else {
      this._boxSelected.next(null);
    }
  }

  onPointerMove(event: MouseEvent, rect: DOMRect): void {
    if (this.isResizing && this.draggedBoxId && this.resizeHandle) {
      this.handleResize(event, rect);
      return;
    }

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
    if (this.isResizing) {
      this.isResizing = false;
      this.resizeHandle = null;
      this.draggedBoxId = null;
      this._dragEnd.next();
      return;
    }

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

  private findHandleByRaycast(): {
    boxId: string;
    boxObject: THREE.Object3D;
    handleSide: HandleSide;
  } | null {
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const intersect of intersects) {
      const object = intersect.object;
      if (object.userData?.[USER_DATA_KEYS.IS_HANDLE]) {
        const handleSide = object.userData[USER_DATA_KEYS.HANDLE_SIDE] as HandleSide;
        // Find parent box
        let parent = object.parent;
        while (parent) {
          if (parent.userData?.[USER_DATA_KEYS.BOX_ID]) {
            return {
              boxId: parent.userData[USER_DATA_KEYS.BOX_ID],
              boxObject: parent,
              handleSide,
            };
          }
          parent = parent.parent;
        }
      }
    }

    return null;
  }

  private findBoxByRaycast(): {
    boxId: string | null;
    boxObject: THREE.Object3D | null;
    intersectionPoint: THREE.Vector3 | null;
  } {
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const intersect of intersects) {
      let object: THREE.Object3D | null = intersect.object;
      // Skip handles
      if (object.userData?.[USER_DATA_KEYS.IS_HANDLE]) {
        continue;
      }
      
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

  private startResize(boxId: string, boxObject: THREE.Object3D, handleSide: HandleSide): void {
    this.isResizing = true;
    this.draggedBoxId = boxId;
    this.resizeHandle = handleSide;
    this._dragStart.next();

    const { width, depth } = this.getBoxDimensions(boxObject);
    this.initialBoxDimensions = { width, depth };

    // Store initial box position (center)
    boxObject.getWorldPosition(this.initialBoxPosition);

    // Store initial mouse position in 3D space
    const target = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.plane, target)) {
      this.initialMousePosition.copy(target);
    }
  }

  private handleResize(event: MouseEvent, rect: DOMRect): void {
    if (!this.draggedBoxId || !this.resizeHandle) return;

    this.updateMouse(event, rect);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const target = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(this.plane, target)) return;

    // Calculate delta from initial position
    const delta = new THREE.Vector3().subVectors(target, this.initialMousePosition);

    let newWidth = this.initialBoxDimensions.width;
    let newDepth = this.initialBoxDimensions.depth;
    let newX = this.initialBoxPosition.x;
    let newZ = this.initialBoxPosition.z;

    // We want 1:1 movement.
    // If we drag RIGHT handle by +10mm, width increases by +10mm, and center moves by +5mm.
    // If we drag LEFT handle by -10mm, width increases by +10mm, and center moves by -5mm.

    switch (this.resizeHandle) {
      case HandleSide.LEFT:
        // Dragging left (negative X) increases width
        // Delta X is negative when moving left
        newWidth = this.initialBoxDimensions.width - delta.x;
        newX = this.initialBoxPosition.x + delta.x / 2;
        break;
      case HandleSide.RIGHT:
        // Dragging right (positive X) increases width
        newWidth = this.initialBoxDimensions.width + delta.x;
        newX = this.initialBoxPosition.x + delta.x / 2;
        break;
      case HandleSide.TOP:
        // Dragging top (negative Z) increases depth
        newDepth = this.initialBoxDimensions.depth - delta.z;
        newZ = this.initialBoxPosition.z + delta.z / 2;
        break;
      case HandleSide.BOTTOM:
        // Dragging bottom (positive Z) increases depth
        newDepth = this.initialBoxDimensions.depth + delta.z;
        newZ = this.initialBoxPosition.z + delta.z / 2;
        break;
    }

    // Convert to grid units and snap
    const widthGridUnits = Math.max(1, Math.round(this.gridService.mmToGridUnits(newWidth)));
    const depthGridUnits = Math.max(1, Math.round(this.gridService.mmToGridUnits(newDepth)));

    // Recalculate position based on snapped dimensions to keep the anchor point fixed
    // Anchor point logic:
    // If resizing RIGHT, Left edge is anchor.
    // Anchor X = Initial Center X - Initial Width / 2
    // New Center X = Anchor X + New Width / 2
    
    const initialWidth = this.initialBoxDimensions.width;
    const initialDepth = this.initialBoxDimensions.depth;
    const initialX = this.initialBoxPosition.x;
    const initialZ = this.initialBoxPosition.z;

    const newWidthMm = this.gridService.gridUnitsToMm(widthGridUnits);
    const newDepthMm = this.gridService.gridUnitsToMm(depthGridUnits);

    let finalX = newX;
    let finalZ = newZ;

    if (this.resizeHandle === HandleSide.LEFT) {
        const anchorRight = initialX + initialWidth / 2;
        finalX = anchorRight - newWidthMm / 2;
    } else if (this.resizeHandle === HandleSide.RIGHT) {
        const anchorLeft = initialX - initialWidth / 2;
        finalX = anchorLeft + newWidthMm / 2;
    } else if (this.resizeHandle === HandleSide.TOP) {
        const anchorBottom = initialZ + initialDepth / 2;
        finalZ = anchorBottom - newDepthMm / 2;
    } else if (this.resizeHandle === HandleSide.BOTTOM) {
        const anchorTop = initialZ - initialDepth / 2;
        finalZ = anchorTop + newDepthMm / 2;
    }

    // Convert final position to grid units
    // Position is top-left corner in grid system (usually) or center?
    // DrawerService expects x,y as top-left corner in grid units.
    // But here we are dealing with 3D world coordinates where (0,0,0) is center of drawer (usually) or top-left?
    // Let's check GridService.mmToGridUnits and how position is handled.
    // Usually 3D position (center) -> Top-Left Grid Coordinate requires conversion.
    
    // Let's look at calculateSnappedPosition used for dragging:
    // const targetXGridUnits = this.gridService.mmToGridUnits(target.x - width / 2);
    // It seems target.x is center, so target.x - width/2 is left edge.
    
    const leftEdgeMm = finalX - newWidthMm / 2;
    const topEdgeMm = finalZ - newDepthMm / 2; // Z is depth

    const xGridUnits = Math.round(this.gridService.mmToGridUnits(leftEdgeMm));
    const yGridUnits = Math.round(this.gridService.mmToGridUnits(topEdgeMm));

    this._boxResize.next({
      id: this.draggedBoxId,
      width: widthGridUnits,
      depth: depthGridUnits,
      x: xGridUnits,
      y: yGridUnits
    });
  }

  private updateMouse(event: MouseEvent, rect: DOMRect): void {
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
}
