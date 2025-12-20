import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ThreeSceneFacade {
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationId: number | null = null;
  
  // Orthographic camera settings
  private readonly frustumSize = 1000; // Visible area size in mm roughly

  constructor(private readonly container: HTMLElement) {}

  init(): void {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLights();
    this.startAnimationLoop();
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf3f4f6); // Gray-100 for better contrast with white boxes
  }

  setBackground(color: THREE.Color | null): void {
    if (this.scene) {
      this.scene.background = color;
    }
  }

  private initCamera(): void {
    const { clientWidth, clientHeight } = this.container;
    const aspect = clientWidth / clientHeight;
    
    // Setup Orthographic Camera
    // Left, Right, Top, Bottom, Near, Far
    this.camera = new THREE.OrthographicCamera(
      this.frustumSize * aspect / -2,
      this.frustumSize * aspect / 2,
      this.frustumSize / 2,
      this.frustumSize / -2,
      -2000, // Near plane (allows things to be behind camera target slightly)
      5000   // Far plane
    );

    // Isometric position (Key is all axis have same magnitude roughly)
    // We adjust distances to ensure good initial zoom
    this.camera.position.set(500, 500, 500); 
    this.camera.zoom = 1;
    this.camera.lookAt(0, 0, 0);
  }

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      logarithmicDepthBuffer: true // Helps with z-fighting in ortho
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    
    this.container.appendChild(this.renderer.domElement);
  }

  private initControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Disable rotation as per user request
    this.controls.enableRotate = false;
    
    // Map Left Mouse Button to PAN instead of ROTATE
    // Map Single Finger to PAN on mobile
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    
    this.controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    // Zoom limits for Orthographic (Zoom is actually a scale factor)
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 4;
  }

  setControlsTarget(x: number, y: number, z: number): void {
    if (this.controls) {
      this.controls.target.set(x, y, z);
      this.controls.update();
    }
  }

  resetCamera(): void {
    if (this.controls && this.camera) {
      const target = this.controls.target;
      
      // Reset to isometric angle
      this.camera.position.set(target.x + 500, 500, target.z + 500);
      this.camera.lookAt(target.x, 0, target.z);
      this.camera.zoom = 1;
      this.camera.updateProjectionMatrix(); // Important for ortho zoom handling
      
      this.controls.update();
    }
  }

  zoomIn(): void {
    if (this.camera && this.controls) {
      const step = 1.2;
      const targetZoom = Math.min(this.controls.maxZoom, this.camera.zoom * step);
      this.smoothZoom(targetZoom);
    }
  }

  zoomOut(): void {
    if (this.camera && this.controls) {
      const step = 0.8;
      const targetZoom = Math.max(this.controls.minZoom, this.camera.zoom * step);
      this.smoothZoom(targetZoom);
    }
  }

  private smoothZoom(targetZoom: number): void {
    // Basic implementation without external animation library
    // The OrbitControls damping will NOT help with direct zoom property changes
    // So we just set it and update projection matrix
    this.camera.zoom = targetZoom;
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  enableControls(enabled: boolean): void {
    if (this.controls) {
      this.controls.enabled = enabled;
    }
  }

  private initLights(): void {
    // 1. Hemisphere Light - Natural gradient sky/ground light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.7);
    this.scene.add(hemiLight);
    
    // 2. Main Directional Light (Sun) - Creates defined shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(300, 800, 400);
    mainLight.castShadow = true;
    
    // Improve shadow quality for Ortho
    const shadowSize = 1000;
    mainLight.shadow.camera.left = -shadowSize;
    mainLight.shadow.camera.right = shadowSize;
    mainLight.shadow.camera.top = shadowSize;
    mainLight.shadow.camera.bottom = -shadowSize;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001; // Less aggressive bias
    mainLight.shadow.radius = 4; // Blur shadows
    
    this.scene.add(mainLight);

    // 3. Ambient Light - Soft global fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);

    // 4. Rim/Fill Light - Softens harsh shadows and adds dimension
    const fillLight = new THREE.DirectionalLight(0xeef2ff, 0.3);
    fillLight.position.set(-500, 300, -500);
    this.scene.add(fillLight);
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.controls.update();
      this.updateHandleScales();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private updateHandleScales(): void {
    if (!this.renderer || !this.camera || !this.scene) return;

    const containerHeight = this.renderer.domElement.clientHeight;
    if (!containerHeight) return;

    // Orthographic Pixel Size calculation:
    // 1px = (frustumSize / zoom) / containerHeight mm
    // Target 35px on screen.
    const targetMm = (35 * this.frustumSize) / (this.camera.zoom * containerHeight);

    // The handle base diameter is 44mm (radius 22mm * 2)
    const baseDiameter = 44;
    const scale = targetMm / baseDiameter;

    this.scene.traverse((obj) => {
      if (obj.name === 'handle' && obj instanceof THREE.Group) {
        obj.scale.set(scale, scale, scale);
      }
    });
  }

  resize(width: number, height: number): void {
    const aspect = width / height;
    
    // Update Orthographic Frustum
    this.camera.left = -this.frustumSize * aspect / 2;
    this.camera.right = this.frustumSize * aspect / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;
    
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }

    this.renderer.dispose();
    this.controls.dispose();
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
         if (object.geometry) {
           object.geometry.dispose();
         }
      }
    });
    
    this.scene.clear();
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getControls(): OrbitControls {
    return this.controls;
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
