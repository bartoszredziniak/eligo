import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ThreeSceneFacade {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationId: number | null = null;

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
    this.scene.background = new THREE.Color(0xfafaf9); // warm grey - stone-50
  }

  setBackground(color: THREE.Color | null): void {
    if (this.scene) {
      this.scene.background = color;
    }
  }

  private initCamera(): void {
    const { clientWidth, clientHeight } = this.container;
    this.camera = new THREE.PerspectiveCamera(
      45,
      clientWidth / clientHeight,
      0.1,
      5000
    );
    this.camera.position.set(800, 800, 800);
    this.camera.lookAt(0, 0, 0);
  }

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
  }

  private initControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 100;
    this.controls.maxDistance = 5000;
  }

  setControlsTarget(x: number, y: number, z: number): void {
    if (this.controls) {
      this.controls.target.set(x, y, z);
      this.controls.update();
    }
  }

  resetCamera(): void {
    if (this.controls && this.camera) {
      // Reset to default position (top-down isometric view)
      // We use the current target as the center point
      const target = this.controls.target;
      
      // Position camera high up and slightly offset to maintain orientation
      this.camera.position.set(target.x, 1200, target.z + 0.1);
      this.camera.lookAt(target.x, 0, target.z);
      
      this.controls.update();
    }
  }

  enableControls(enabled: boolean): void {
    if (this.controls) {
      this.controls.enabled = enabled;
    }
  }

  private initLights(): void {
    // Brighter ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambientLight);

    // Add hemisphere light for natural sky/ground lighting
    const hemisphereLight = new THREE.HemisphereLight(
      0xffffff, // sky color - white
      0xf0f0f0, // ground color - light grey
      0.4
    );
    this.scene.add(hemisphereLight);

    // Main directional light (softer than before)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(500, 1000, 500);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Secondary directional light to fill shadows from different angle
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-300, 500, -300);
    this.scene.add(fillLight);
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Remove canvas from DOM
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
    }

    this.renderer.dispose();
    this.controls.dispose();
    
    // Traverse and dispose remaining objects (e.g. lights, helpers)
    // Note: Visualizers should have already disposed their meshes.
    // We avoid disposing materials here as they might be shared/managed by factory.
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

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getControls(): OrbitControls {
    return this.controls;
  }

  /**
   * Manual render for one-time rendering (e.g., for image capture)
   */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
