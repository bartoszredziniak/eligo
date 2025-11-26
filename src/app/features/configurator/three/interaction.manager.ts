import * as THREE from 'three';
import { Subject } from 'rxjs';

export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Floor plane at y=0

  private _boxSelected = new Subject<string | null>();
  boxSelected$ = this._boxSelected.asObservable();

  private _boxDrag = new Subject<{ id: string; x: number; y: number }>();
  boxDrag$ = this._boxDrag.asObservable();

  private isDragging = false;
  private draggedBoxId: string | null = null;
  private dragOffset = new THREE.Vector3();
  private drawerDimensions = { width: 0, depth: 0 };

  constructor(
    private readonly camera: THREE.Camera,
    private readonly scene: THREE.Scene
  ) {}

  updateDrawerDimensions(width: number, depth: number) {
    this.drawerDimensions = { width, depth };
  }

  onPointerDown(event: MouseEvent, rect: DOMRect): void {
    this.updateMouse(event, rect);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    let selectedBoxId: string | null = null;
    let intersectionPoint: THREE.Vector3 | null = null;
    let boxObject: THREE.Object3D | null = null;

    for (const intersect of intersects) {
      let object: THREE.Object3D | null = intersect.object;
      while (object) {
        if (object.userData && object.userData['boxId']) {
          selectedBoxId = object.userData['boxId'];
          boxObject = object;
          intersectionPoint = intersect.point;
          break;
        }
        object = object.parent;
      }
      if (selectedBoxId) break;
    }

    if (selectedBoxId && boxObject && intersectionPoint) {
      this.isDragging = true;
      this.draggedBoxId = selectedBoxId;
      
      // Calculate offset from box center to intersection point
      // We need the box position in world space
      const boxPos = new THREE.Vector3();
      boxObject.getWorldPosition(boxPos);
      
      // We are dragging on XZ plane
      this.dragOffset.copy(boxPos).sub(intersectionPoint);
      
      this._boxSelected.next(selectedBoxId);
    } else {
      this._boxSelected.next(null);
    }
  }

  onPointerMove(event: MouseEvent, rect: DOMRect): void {
    if (!this.isDragging || !this.draggedBoxId) return;

    this.updateMouse(event, rect);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const target = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.plane, target)) {
      // Apply offset
      target.add(this.dragOffset);

      // Clamp to drawer dimensions
      // Box position is top-left corner (based on visualizer/pool logic)
      // But wait, in pool we set position: x + width/2.
      // So the mesh position IS the center.
      // BUT the data model (Box) stores x,y as top-left?
      // Let's check BoxMeshPool.updateMesh:
      // mesh.position.set(box.x + box.width / 2, ...)
      // So box.x = mesh.position.x - box.width / 2
      
      // We need to know the box dimensions to clamp correctly.
      // We can get them from the dragged object (it's a mesh with scale = dimensions)
      const mesh = this.scene.children.find(c => c.userData && c.userData['boxId'] === this.draggedBoxId) as THREE.Mesh;
      if (!mesh) return;
      
      const width = mesh.scale.x;
      const depth = mesh.scale.z;
      
      // Calculate proposed Top-Left X/Y
      let newX = target.x - width / 2;
      let newY = target.z - depth / 2;

      // Clamp
      // 0 <= x <= drawerWidth - boxWidth
      newX = Math.max(0, Math.min(newX, this.drawerDimensions.width - width));
      newY = Math.max(0, Math.min(newY, this.drawerDimensions.depth - depth));

      // Emit new Top-Left coordinates
      this._boxDrag.next({
        id: this.draggedBoxId,
        x: Math.round(newX),
        y: Math.round(newY)
      });
    }
  }

  onPointerUp(): void {
    this.isDragging = false;
    this.draggedBoxId = null;
  }

  private updateMouse(event: MouseEvent, rect: DOMRect): void {
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
}
