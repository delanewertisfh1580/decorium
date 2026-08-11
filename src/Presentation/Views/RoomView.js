import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TYPE_COLORS = {
  sofa: 0x6b86a6,
  chair: 0x527c70,
  table: 0xb98a5c,
  lighting: 0xd8ad68,
  storage: 0x8796a9,
  decor: 0xb47772,
  bed: 0x877ba6
};

export class RoomView {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c1119);
    this.scene.fog = new THREE.Fog(0x0c1119, 12, 30);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.floor = null;
    this.furnitureGroup = new THREE.Group();
    this.scene.add(this.furnitureGroup);
    this.onSelect = () => {};
    this.onFloorClick = () => {};
    this._animationFrame = null;
    this._roomSize = { width: 8, depth: 6 };
  }

  async init() {
    this._createLights();
    this.canvas.addEventListener('click', this._handleClick);
    window.addEventListener('resize', this._resize);
    this._resize();
  }

  setInteractionHandlers({ onSelect, onFloorClick }) {
    this.onSelect = onSelect ?? (() => {});
    this.onFloorClick = onFloorClick ?? (() => {});
  }

  _createLights() {
    const ambient = new THREE.HemisphereLight(0xbad7ff, 0x202938, 1.8);
    this.scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffe8c7, 2.4);
    key.position.set(4, 10, 5);
    key.castShadow = true;
    this.scene.add(key);
    const rim = new THREE.PointLight(0x5799f4, 12, 18);
    rim.position.set(-3, 4, -4);
    this.scene.add(rim);
  }

  _buildRoom(width, depth) {
    this._roomSize = { width, depth };
    if (this.floor) this.scene.remove(this.floor);

    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshStandardMaterial({ color: 0x263241, roughness: 0.88, metalness: 0.08 })
    );
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.set(width / 2, 0, depth / 2);
    this.floor.userData.kind = 'floor';
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    const grid = new THREE.GridHelper(Math.max(width, depth), Math.round(Math.max(width, depth) * 2), 0x6f91b8, 0x35465d);
    grid.position.set(width / 2, 0.012, depth / 2);
    grid.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
    this.scene.add(grid);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2532, roughness: 0.95 });
    const wallHeight = 3;
    const walls = [
      [width, wallHeight, 0.08, width / 2, wallHeight / 2, 0],
      [width, wallHeight, 0.08, width / 2, wallHeight / 2, depth],
      [0.08, wallHeight, depth, 0, wallHeight / 2, depth / 2],
      [0.08, wallHeight, depth, width, wallHeight / 2, depth / 2]
    ];
    for (const [w, h, d, x, y, z] of walls) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMaterial);
      wall.position.set(x, y, z);
      wall.receiveShadow = true;
      this.scene.add(wall);
    }

    this.camera.position.set(width * 1.05, Math.max(5, depth * 0.95), depth * 1.2);
    this.controls.target.set(width / 2, 0.8, depth / 2);
    this.controls.minDistance = 4;
    this.controls.maxDistance = Math.max(width, depth) * 2.5;
    this.controls.update();
  }

  render(roomState, selectedItemId = null) {
    if (!roomState) return;
    if (this._roomSize.width !== roomState.width || this._roomSize.depth !== roomState.depth || !this.floor) {
      this._buildRoom(roomState.width, roomState.depth);
    }

    while (this.furnitureGroup.children.length) {
      const child = this.furnitureGroup.children.pop();
      child.geometry?.dispose();
      child.material?.dispose();
    }

    for (const placed of roomState.getItems()) {
      const dimensions = placed.dimensions ?? { x: 1, z: 1 };
      const item = placed.item;
      const height = 0.55 + (item.featureVector?.sizeNorm ?? 0.5) * 1.35;
      const material = new THREE.MeshStandardMaterial({
        color: TYPE_COLORS[item.type] ?? 0x73859c,
        roughness: 0.68,
        metalness: item.featureVector?.metalShare ?? 0.1,
        emissive: selectedItemId === placed.id ? 0x2f6fc5 : 0x000000,
        emissiveIntensity: selectedItemId === placed.id ? 0.45 : 0
      });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(dimensions.x, height, dimensions.z), material);
      mesh.position.set(placed.position.x, height / 2, placed.position.z);
      mesh.rotation.y = THREE.MathUtils.degToRad(placed.rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.kind = 'item';
      mesh.userData.itemId = placed.id;
      this.furnitureGroup.add(mesh);
    }
  }

  getWorldPosition(event) {
    this._setPointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.floor)[0];
    if (!hit) return null;
    return {
      x: THREE.MathUtils.clamp(hit.point.x, 0.1, this._roomSize.width - 0.1),
      y: 0,
      z: THREE.MathUtils.clamp(hit.point.z, 0.1, this._roomSize.depth - 0.1)
    };
  }

  _setPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _handleClick = (event) => {
    this._setPointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const itemHit = this.raycaster.intersectObjects(this.furnitureGroup.children, false)[0];
    if (itemHit?.object.userData.itemId) {
      this.onSelect(itemHit.object.userData.itemId);
      return;
    }
    const position = this.getWorldPosition(event);
    if (position) this.onFloorClick(position);
  };

  _resize = () => {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  startRenderLoop() {
    const render = () => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this._animationFrame = requestAnimationFrame(render);
    };
    render();
  }

  destroy() {
    if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
    this.canvas.removeEventListener('click', this._handleClick);
    window.removeEventListener('resize', this._resize);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
