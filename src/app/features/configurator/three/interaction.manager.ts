import * as THREE from 'three';
import { Subject } from 'rxjs';
import { GridService } from '../../../core/services/grid.service';
import { HandleSide, USER_DATA_KEYS } from './constants';
import { Box } from '../../../core/models/drawer.models';
import { GridLayout } from '../../../core/models/grid.models';

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
  
  private _boxResize = new Subject<{ id: string; width: number; depth: number; x: number; y: number }>();
  boxResize$ = this._boxResize.asObservable();

  private _boxContextMenu = new Subject<{ boxId: string; event: PointerEvent }>();
  boxContextMenu$ = this._boxContextMenu.asObservable();

  private _dragStart = new Subject<void>();
  dragStart$ = this._dragStart.asObservable();

  private _dragEnd = new Subject<void>();
  dragEnd$ = this._dragEnd.asObservable();

  private isDragging = false;
  private draggedBoxId: string | null = null;
  private dragOffset = new THREE.Vector3();
  
  // Resize State
  private isResizing = false;
  private resizingBoxId: string | null = null;
  private activeHandleSide: HandleSide | null = null;
  private resizeStartPoint = new THREE.Vector3();
  private initialResizeDims = { width: 0, depth: 0 };
  private initialResizePos = new THREE.Vector3();
  
  private drawerDimensions = { width: 0, depth: 0 };
  private oversizedBoxIds = new Set<string>();
  
  // Touch/Drag distinction variables
  private pointerDownPos = new THREE.Vector2();
  private isPointerDown = false;

  // Constraint validation state
  private boxes: Box[] = [];
  private gridLayout: GridLayout = { gridUnitsWidth: 0, gridUnitsDepth: 0, offsetX: 0, offsetY: 0, totalWidthMm: 0, totalDepthMm: 0 };
  private lastValidDragPosition: { x: number; y: number } | null = null;
  private lastValidResize: { width: number; depth: number; x: number; y: number } | null = null;

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

  updateBoxes(boxes: Box[]): void {
    this.boxes = boxes;
  }

  updateGridLayout(layout: GridLayout): void {
    this.gridLayout = layout;
  }

  onPointerDown(event: PointerEvent, rect: DOMRect): void {
    if (!event.isPrimary) return;
    
    this.isPointerDown = true;
    this.updateMouse(event, rect);
    this.pointerDownPos.set(event.clientX, event.clientY);
    
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check for Resize Handles FIRST (they are on top)
    const handleHit = this.findHandleByRaycast();
    if (handleHit) {
        // Intersect with plane to get ground point
        const target = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.plane, target);
        
        this.startResize(handleHit.boxId, handleHit.handleSide, target);
        return;
    }

    // 2. Check for Boxes
    const { boxId, boxObject, intersectionPoint } = this.findBoxByRaycast();

    if (boxId && boxObject && intersectionPoint) {
      if (event.button === 2) {
        event.preventDefault();
        this._boxContextMenu.next({ boxId, event });
        return;
      }

      if (!this.oversizedBoxIds.has(boxId)) {
        this.startDrag(boxId, boxObject, intersectionPoint);
      }
    }
  }

  onPointerMove(event: PointerEvent, rect: DOMRect): void {
    if (!event.isPrimary) return;
    
    this.updateMouse(event, rect);
    
    // Handle Resizing
    if (this.isResizing && this.resizingBoxId && this.activeHandleSide) {
       this.raycaster.setFromCamera(this.mouse, this.camera);
       const target = new THREE.Vector3();
       if (!this.raycaster.ray.intersectPlane(this.plane, target)) return;
       
       this.handleResize(target);
       return;
    }

    // Hover feedback (change cursor when over handle)
    if (!this.isDragging && !this.isResizing) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const handleHit = this.findHandleByRaycast();
        document.body.style.cursor = handleHit ? 'pointer' : 'default';
    }

    // Handle Dragging
    if (this.isDragging && this.draggedBoxId) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const target = new THREE.Vector3();
        if (!this.raycaster.ray.intersectPlane(this.plane, target)) return;

        target.add(this.dragOffset);

        const mesh = this.findMeshById(this.draggedBoxId);
        if (!mesh) return;

        const currentBox = this.boxes.find(b => b.id === this.draggedBoxId);
        if (!currentBox) return;

        const clampedPosition = this.calculateSnappedPosition(target, mesh);

        // Validate that the new position is valid (within bounds and no collisions)
        if (this.isValidPosition(this.draggedBoxId, clampedPosition.x, clampedPosition.y, currentBox.width, currentBox.depth)) {
            this.lastValidDragPosition = { x: clampedPosition.x, y: clampedPosition.y };
            this._boxDrag.next({
                id: this.draggedBoxId,
                x: clampedPosition.x,
                y: clampedPosition.y,
            });
        }
        // If invalid, don't emit - box stays at last valid position
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (!event.isPrimary) return;
    
    this.isPointerDown = false;
    const dist = this.pointerDownPos.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
    const isClick = dist < 5;

    if (this.isDragging) {
      this.isDragging = false;
      this.draggedBoxId = null;
      this._dragEnd.next();
    }
    
    if (this.isResizing) {
        this.isResizing = false;
        this.resizingBoxId = null;
        this.activeHandleSide = null;
        this._dragEnd.next();
        return; // Resize is never a click
    }
    
    if (isClick) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Important: Ignore handles for selection click? Or re-select box if handle clicked?
        // Let's just select the box.
        const { boxId } = this.findBoxByRaycast();
        
        this._boxSelected.next(boxId); 
        if (boxId) {
             this._boxClicked.next(boxId);
        }
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

  private findHandleByRaycast(): { boxId: string; handleSide: HandleSide } | null {
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      
      for (const hit of intersects) {
          let obj: THREE.Object3D | null = hit.object;
          while (obj) {
              if (obj.userData?.[USER_DATA_KEYS.HANDLE_SIDE]) {
                  return {
                      boxId: obj.userData[USER_DATA_KEYS.BOX_ID],
                      handleSide: obj.userData[USER_DATA_KEYS.HANDLE_SIDE] as HandleSide
                  };
              }
              obj = obj.parent;
          }
      }
      return null;
  }

  private handleResize(currentPoint: THREE.Vector3): void {
      // Calculate delta from start
      const deltaX = currentPoint.x - this.resizeStartPoint.x;
      const deltaZ = currentPoint.z - this.resizeStartPoint.z;
      
      // Calculate NEW dimensions based on side
      // Snap deltas to grid first? Or snap final result?
      // Better to snap final result logic like in boxDrag.
      
      // But wait, resizing changes Center AND Size.
      // Logic: 
      // 1. Calculate raw new edge position.
      // 2. Snap edge to grid.
      // 3. Re-calculate Width/Center from snapped edge + fixed opposite edge.
      
      let newWidth = this.initialResizeDims.width;
      let newDepth = this.initialResizeDims.depth;
      let newX = this.initialResizePos.x;
      let newZ = this.initialResizePos.z;
      
      // Helper to snap value
      const snap = (v: number) => this.gridService.snapToGrid(v);

      if (this.activeHandleSide === HandleSide.RIGHT) {
           // Right edge moved. Left edge fixed.
           // Left Edge X = oldX - oldWidth/2
           const leftEdge = this.initialResizePos.x - this.initialResizeDims.width / 2;
           // Raw New Right Edge
           const rawRightEdge = (this.initialResizePos.x + this.initialResizeDims.width / 2) + deltaX;
           // Snap Right Edge
           const snappedRightEdge = snap(rawRightEdge);
           
           // New Width = Right - Left
           newWidth = Math.max(50, snappedRightEdge - leftEdge); // Min width check?
           // New Center = Left + NewWidth/2
           newX = leftEdge + newWidth / 2;
           
      } else if (this.activeHandleSide === HandleSide.LEFT) {
           // Left edge moved. Right edge fixed.
           const rightEdge = this.initialResizePos.x + this.initialResizeDims.width / 2;
           const rawLeftEdge = (this.initialResizePos.x - this.initialResizeDims.width / 2) + deltaX;
           const snappedLeftEdge = snap(rawLeftEdge);
           
           newWidth = Math.max(50, rightEdge - snappedLeftEdge);
           newX = rightEdge - newWidth / 2;
           
      } else if (this.activeHandleSide === HandleSide.BOTTOM) {
          // Bottom (+Z) moved. Top (-Z) fixed.
          const topEdge = this.initialResizePos.z - this.initialResizeDims.depth / 2;
          const rawBottomEdge = (this.initialResizePos.z + this.initialResizeDims.depth / 2) + deltaZ;
          const snappedBottomEdge = snap(rawBottomEdge);
          
          newDepth = Math.max(50, snappedBottomEdge - topEdge);
          newZ = topEdge + newDepth / 2;
          
      } else if (this.activeHandleSide === HandleSide.TOP) {
          // Top (-Z) moved. Bottom (+Z) fixed.
          const bottomEdge = this.initialResizePos.z + this.initialResizeDims.depth / 2;
          const rawTopEdge = (this.initialResizePos.z - this.initialResizeDims.depth / 2) + deltaZ;
          const snappedTopEdge = snap(rawTopEdge);
          
          newDepth = Math.max(50, bottomEdge - snappedTopEdge);
          newZ = bottomEdge - newDepth / 2;
      }
      
      // Convert to grid units for validation
      const newWidthGridUnits = this.gridService.mmToGridUnits(newWidth);
      const newDepthGridUnits = this.gridService.mmToGridUnits(newDepth);
      const newXGridUnits = this.gridService.mmToGridUnits(newX - newWidth / 2);
      const newYGridUnits = this.gridService.mmToGridUnits(newZ - newDepth / 2);
      
      // Validate that the new size and position are valid
      if (this.isValidPosition(this.resizingBoxId!, newXGridUnits, newYGridUnits, newWidthGridUnits, newDepthGridUnits)) {
          this.lastValidResize = { 
              width: newWidthGridUnits, 
              depth: newDepthGridUnits, 
              x: newXGridUnits, 
              y: newYGridUnits 
          };
          this._boxResize.next({
              id: this.resizingBoxId!,
              width: newWidthGridUnits,
              depth: newDepthGridUnits,
              x: newXGridUnits,
              y: newYGridUnits
          });
      }
      // If invalid, don't emit - box stays at last valid size/position
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

  private startResize(
    boxId: string,
    handleSide: HandleSide,
    intersectionPoint: THREE.Vector3
  ): void {
     this.isResizing = true;
     this.resizingBoxId = boxId;
     this.activeHandleSide = handleSide;
     this._dragStart.next(); // Reuse drag start for UI feedback (hiding tooltips etc)
     
     // Calculate initial offset for smooth dragging
     // For resize, we track the *ground plane* intersection
     this.resizeStartPoint.copy(intersectionPoint);
     
     const mesh = this.findMeshById(boxId);
     if (mesh) {
       this.initialResizeDims = this.getBoxDimensions(mesh);
       this.initialResizePos.copy(mesh.position);
     }
  }

  private updateMouse(event: PointerEvent, rect: DOMRect): void {
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Check if a box at given position with given size is within drawer bounds
   */
  private isWithinBounds(x: number, y: number, width: number, depth: number): boolean {
    return (
      x >= 0 &&
      y >= 0 &&
      x + width <= this.gridLayout.gridUnitsWidth &&
      y + depth <= this.gridLayout.gridUnitsDepth
    );
  }

  /**
   * Check if two boxes collide (AABB collision detection)
   */
  private checkCollision(b1: { x: number; y: number; width: number; depth: number },
                         b2: { x: number; y: number; width: number; depth: number }): boolean {
    // Check if one box is to the left or right of the other
    if (b1.x + b1.width <= b2.x || b2.x + b2.width <= b1.x) {
      return false;
    }
    // Check if one box is above or below the other
    if (b1.y + b1.depth <= b2.y || b2.y + b2.depth <= b1.y) {
      return false;
    }
    return true;
  }

  /**
   * Check if moving a box to a new position would cause collision with other boxes
   */
  private hasCollisionWithOthers(boxId: string, x: number, y: number, width: number, depth: number): boolean {
    const testBox = { x, y, width, depth };
    
    for (const box of this.boxes) {
      if (box.id === boxId) continue;
      if (this.checkCollision(testBox, box)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validate if a position is valid (within bounds and no collisions)
   */
  private isValidPosition(boxId: string, x: number, y: number, width: number, depth: number): boolean {
    return this.isWithinBounds(x, y, width, depth) && 
           !this.hasCollisionWithOthers(boxId, x, y, width, depth);
  }
}
