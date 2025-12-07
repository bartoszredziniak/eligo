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

    const layout = this.gridService.gridLayout();
    const cellSize = this.gridService.cellSize();

    // 1. Calculate new potential dimensions in mm based on mouse movement
    // We stick to the existing logic for calculating raw MM values
    let newWidthMm = this.initialBoxDimensions.width;
    let newDepthMm = this.initialBoxDimensions.depth;

    if (this.resizeHandle === HandleSide.LEFT || this.resizeHandle === HandleSide.RIGHT) {
      newWidthMm = this.resizeHandle === HandleSide.LEFT
        ? this.initialBoxDimensions.width - delta.x
        : this.initialBoxDimensions.width + delta.x;
    } else {
      newDepthMm = this.resizeHandle === HandleSide.TOP
        ? this.initialBoxDimensions.depth - delta.z
        : this.initialBoxDimensions.depth + delta.z;
    }

    // 2. Convert to potential Grid Units (using round for intuitive snapping)
    let widthGridUnits = Math.max(1, Math.round(newWidthMm / cellSize));
    let depthGridUnits = Math.max(1, Math.round(newDepthMm / cellSize));

    // 3. Derive Initial Grid State (Anchors)
    const initLeftMm = this.initialBoxPosition.x - this.initialBoxDimensions.width / 2;
    const initTopMm = this.initialBoxPosition.z - this.initialBoxDimensions.depth / 2; // Z is depth
    
    // We use round here to snap the initial position to the nearest grid line to avoid drifting
    const initXGrid = Math.round(initLeftMm / cellSize);
    const initYGrid = Math.round(initTopMm / cellSize);

    // 4. Apply Constraints based on fixed anchor points
    let finalXGrid = initXGrid;
    let finalYGrid = initYGrid;

    // Horizontal Constraints (Width/X)
    if (this.resizeHandle === HandleSide.LEFT) {
      // Anchor is Right Edge (fixed)
      const anchorRightGrid = initXGrid + Math.round(this.initialBoxDimensions.width / cellSize);
      
      // Constraint: New Left must be >= 0
      // Right - Width >= 0 => Width <= Right
      const maxWidth = anchorRightGrid;
      widthGridUnits = Math.min(widthGridUnits, maxWidth);
      
      // Allow shrinking, but min is 1 (already handled)
      
      // Recalculate X
      finalXGrid = anchorRightGrid - widthGridUnits;
    } else if (this.resizeHandle === HandleSide.RIGHT) {
      // Anchor is Left Edge (fixed) => initXGrid
      // Constraint: Right <= MaxWidth
      // Left + Width <= MaxGridWidth => Width <= MaxGridWidth - Left
      const maxWidth = layout.gridUnitsWidth - initXGrid;
      widthGridUnits = Math.min(widthGridUnits, maxWidth);
      
      // X stays same
      finalXGrid = initXGrid;
    }

    // Vertical Constraints (Depth/Y)
    if (this.resizeHandle === HandleSide.TOP) {
      // Anchor is Bottom Edge (fixed) (Positive Z)
      const anchorBottomGrid = initYGrid + Math.round(this.initialBoxDimensions.depth / cellSize);
      
      // Constraint: Top >= 0
      // Bottom - Depth >= 0 => Depth <= Bottom
      const maxDepth = anchorBottomGrid;
      depthGridUnits = Math.min(depthGridUnits, maxDepth);
      
      // Recalculate Y
      finalYGrid = anchorBottomGrid - depthGridUnits;
    } else if (this.resizeHandle === HandleSide.BOTTOM) {
      // Anchor is Top Edge (fixed) => initYGrid
      // Constraint: Bottom <= MaxDepth
      // Top + Depth <= MaxGridDepth => Depth <= MaxGridDepth - Top
      const maxDepth = layout.gridUnitsDepth - initYGrid;
      depthGridUnits = Math.min(depthGridUnits, maxDepth);
      
      // Y stays same
      finalYGrid = initYGrid;
    }

    this._boxResize.next({
      id: this.draggedBoxId,
      width: widthGridUnits,
      depth: depthGridUnits,
      x: finalXGrid,
      y: finalYGrid
    });
  }

  private updateMouse(event: MouseEvent, rect: DOMRect): void {
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
}
