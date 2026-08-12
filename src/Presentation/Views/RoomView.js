import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import ItemVisualFactory from '../Scene/ItemVisualFactory.js';
import SceneLifeSystem from '../Scene/SceneLifeSystem.js';

const DRAG_THRESHOLD = 5;
const ANIMATION_MS = 220;

function easeOutCubic(value) {
  return 1 - ((1 - value) ** 3);
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function disposeObject(object) {
  object.traverse(child => {
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach(material => material.dispose());
    else child.material?.dispose();
  });
}

function makeMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.78,
    metalness: options.metalness ?? 0,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function addRoomBox(group, size, position, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), makeMaterial(color, options));
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  group.add(mesh);
  return mesh;
}

export class RoomView {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b121b);
    this.scene.fog = new THREE.Fog(0x0b121b, 14, 32);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.zoomSpeed = 0.85;
    this.controls.rotateSpeed = 0.72;
    this.controls.panSpeed = 0.75;
    this.controls.minPolarAngle = 0.28;
    this.controls.maxPolarAngle = Math.PI / 2.02;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.roomGroup = new THREE.Group();
    this.furnitureGroup = new THREE.Group();
    this.scene.add(this.roomGroup, this.furnitureGroup);
    this.floor = null;
    this.objectsById = new Map();
    this.animations = new Set();
    this.ghost = null;
    this.ghostItem = null;
    this.pointerState = null;
    this._animationFrame = null;
    this._roomSize = { width: 8, depth: 6 };
    this._cameraHome = null;
    this.sceneLife = null;

    this.onSelect = () => {};
    this.onPlace = () => {};
    this.onMove = () => {};
    this.onFloorClick = () => {};
    this.onCancelMove = () => {};
    this.onPreview = () => true;
  }

  async init() {
    this._createLights();
    this.canvas.addEventListener('pointerdown', this._handlePointerDown);
    this.canvas.addEventListener('pointermove', this._handlePointerMove);
    this.canvas.addEventListener('pointerup', this._handlePointerUp);
    this.canvas.addEventListener('pointercancel', this._handlePointerCancel);
    this.canvas.addEventListener('contextmenu', event => event.preventDefault());
    window.addEventListener('resize', this._resize);
    this._resize();
  }

  setInteractionHandlers({ onSelect, onPlace, onMove, onFloorClick, onCancelMove, onPreview }) {
    this.onSelect = onSelect ?? (() => {});
    this.onPlace = onPlace ?? (() => {});
    this.onMove = onMove ?? (() => {});
    this.onFloorClick = onFloorClick ?? (() => {});
    this.onCancelMove = onCancelMove ?? (() => {});
    this.onPreview = onPreview ?? (() => true);
  }

  _createLights() {
    const ambient = new THREE.HemisphereLight(0xbad7ff, 0x202938, 1.9);
    this.scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffe8c7, 3.2);
    key.position.set(4, 10, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    this.scene.add(key);
    const rim = new THREE.PointLight(0x5799f4, 15, 20);
    rim.position.set(-3, 4, -4);
    this.scene.add(rim);
    const warm = new THREE.PointLight(0xffb46d, 7, 12);
    warm.position.set(6, 2.5, 5);
    this.scene.add(warm);
  }

  _buildRoom(width, depth) {
    this._roomSize = { width, depth };
    this.roomGroup.clear();
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      makeMaterial(0x2d3d4b, { roughness: 0.9 })
    );
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.set(width / 2, 0, depth / 2);
    this.floor.userData.kind = 'floor';
    this.floor.receiveShadow = true;
    this.roomGroup.add(this.floor);

    const grid = new THREE.GridHelper(Math.max(width, depth), Math.round(Math.max(width, depth) * 2), 0x7591ad, 0x40546a);
    grid.position.set(width / 2, 0.012, depth / 2);
    grid.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
    grid.material.transparent = true;
    grid.material.opacity = 0.28;
    this.roomGroup.add(grid);

    const wallMaterial = { color: 0x1c2a37, roughness: 0.96 };
    const wallHeight = 3.2;
    const walls = [
      [width, wallHeight, 0.08, width / 2, wallHeight / 2, 0],
      [width, wallHeight, 0.08, width / 2, wallHeight / 2, depth],
      [0.08, wallHeight, depth, 0, wallHeight / 2, depth / 2],
      [0.08, wallHeight, depth, width, wallHeight / 2, depth / 2]
    ];
    for (const [wallWidth, wallHeightValue, wallDepth, x, y, z] of walls) {
      addRoomBox(this.roomGroup, [wallWidth, wallHeightValue, wallDepth], [x, y, z], wallMaterial.color, wallMaterial);
    }
    this._addRoomDecor(width, depth, wallHeight);
    this.sceneLife?.destroy();
    this.sceneLife = new SceneLifeSystem(this.scene, this.roomGroup, { width, depth });

    this._cameraHome = {
      position: new THREE.Vector3(width * 1.16, Math.max(5.4, depth * 1.1), depth * 1.34),
      target: new THREE.Vector3(width / 2, 0.8, depth / 2)
    };
    this.resetCamera();
  }

  _addRoomDecor(width, depth, wallHeight) {
    // Window, wall panels and a ceiling pendant make the empty starting room read as a place.
    addRoomBox(this.roomGroup, [2.15, 1.35, 0.035], [width * 0.68, 1.92, depth - 0.055], 0x6d9bb5, {
      roughness: 0.28,
      emissive: 0x17374a,
      emissiveIntensity: 0.35,
      castShadow: false
    });
    addRoomBox(this.roomGroup, [2.28, 0.08, 0.06], [width * 0.68, 1.92, depth - 0.08], 0xd4aa72, { castShadow: false });
    addRoomBox(this.roomGroup, [0.08, 1.42, 0.06], [width * 0.68, 1.92, depth - 0.08], 0xd4aa72, { castShadow: false });
    addRoomBox(this.roomGroup, [0.1, wallHeight - 0.3, 0.06], [0.09, wallHeight / 2, depth / 2], 0x344758, { castShadow: false });

    const pendant = new THREE.Group();
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 8), makeMaterial(0x27323e));
    cord.position.y = 2.82;
    pendant.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.28, 24), makeMaterial(0xd1a267, { emissive: 0xffb75f, emissiveIntensity: 0.18 }));
    shade.position.y = 2.47;
    shade.rotation.x = Math.PI;
    pendant.add(shade);
    pendant.position.set(width * 0.48, 0, depth * 0.46);
    this.roomGroup.add(pendant);

    const planter = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.42, 18), makeMaterial(0x8f7663));
    planter.position.set(width - 0.48, 0.21, depth - 0.45);
    planter.castShadow = true;
    this.roomGroup.add(planter);
    for (const [x, y, z, scale] of [[-0.12, 0.7, 0, 0.2], [0.12, 0.88, 0.03, 0.24], [0, 1.08, -0.02, 0.23]]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(scale, 12, 8), makeMaterial(0x5d8067));
      leaf.position.set(width - 0.48 + x, y, depth - 0.45 + z);
      leaf.scale.y = 1.5;
      leaf.castShadow = true;
      this.roomGroup.add(leaf);
    }
  }

  render(roomState, selectedItemId = null) {
    if (!roomState) return;
    if (this._roomSize.width !== roomState.width || this._roomSize.depth !== roomState.depth || !this.floor) {
      this._buildRoom(roomState.width, roomState.depth);
    }

    const activeIds = new Set();
    for (const placed of roomState.getItems()) {
      activeIds.add(placed.id);
      let object = this.objectsById.get(placed.id);
      if (!object) {
        object = ItemVisualFactory.create(placed.item);
        this._setObjectInstanceId(object, placed.id);
        object.position.set(placed.position.x, placed.position.y ?? 0, placed.position.z);
        object.rotation.y = THREE.MathUtils.degToRad(placed.rotation);
        object.scale.setScalar(0.01);
        this.objectsById.set(placed.id, object);
        this.furnitureGroup.add(object);
        this._animateScale(object, 1);
      } else {
        this._setObjectInstanceId(object, placed.id);
        this._animateTransform(object, placed.position, placed.rotation);
      }
      ItemVisualFactory.setPreviewValidity(object, true);
      ItemVisualFactory.setSelected(object, selectedItemId === placed.id);
    }

    for (const [itemId, object] of this.objectsById) {
      if (!activeIds.has(itemId)) this._animateRemoval(itemId, object);
    }
  }

  _setObjectInstanceId(object, instanceId) {
    object.userData.itemId = instanceId;
    object.traverse(child => {
      if (child.userData?.kind === 'item-part') child.userData.itemId = instanceId;
    });
  }

  _animateTransform(object, position, rotation) {
    const target = {
      x: position.x,
      y: position.y ?? 0,
      z: position.z,
      rotation: THREE.MathUtils.degToRad(rotation)
    };
    const previousTarget = object.userData.animationTarget;
    if (previousTarget && Math.abs(previousTarget.x - target.x) < 0.001 &&
        Math.abs(previousTarget.y - target.y) < 0.001 && Math.abs(previousTarget.z - target.z) < 0.001 &&
        Math.abs(previousTarget.rotation - target.rotation) < 0.001) return;
    object.userData.animationTarget = target;

    const from = { x: object.position.x, y: object.position.y, z: object.position.z, rotation: object.rotation.y };
    let delta = target.rotation - from.rotation;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    this._animate(ANIMATION_MS, progress => {
      const eased = easeOutCubic(progress);
      object.position.x = from.x + (target.x - from.x) * eased;
      object.position.y = from.y + (target.y - from.y) * eased;
      object.position.z = from.z + (target.z - from.z) * eased;
      object.rotation.y = from.rotation + delta * eased;
    });
  }

  _animateScale(object, targetScale) {
    const initialScale = object.scale.x;
    this._animate(ANIMATION_MS, progress => {
      const eased = easeOutCubic(progress);
      object.scale.setScalar(initialScale + (targetScale - initialScale) * eased);
    });
  }

  _animateRemoval(itemId, object) {
    if (object.userData.removing) return;
    object.userData.removing = true;
    this.objectsById.delete(itemId);
    this._animate(ANIMATION_MS, progress => {
      const eased = easeOutCubic(progress);
      object.scale.setScalar(Math.max(0.01, 1 - eased));
      object.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = 1 - eased;
        }
      });
    }, () => {
      this.furnitureGroup.remove(object);
      disposeObject(object);
    });
  }

  _animate(duration, update, complete = () => {}) {
    this.animations.add({ start: performance.now(), duration, update, complete });
  }

  _tickAnimations(now) {
    this.sceneLife?.update(now);
    for (const animation of [...this.animations]) {
      const progress = Math.min(1, (now - animation.start) / animation.duration);
      animation.update(progress);
      if (progress >= 1) {
        this.animations.delete(animation);
        animation.complete();
      }
    }
  }

  beginPlacement(item) {
    this.cancelPlacement();
    this.ghostItem = item;
    this.ghost = ItemVisualFactory.create(item, { ghost: true });
    this.ghost.position.set(this._roomSize.width / 2, 0, this._roomSize.depth / 2);
    this.scene.add(this.ghost);
    this._setGhostPosition(this.ghost.position.x, this.ghost.position.z);
  }

  cancelPlacement() {
    if (this.ghost) {
      this.scene.remove(this.ghost);
      disposeObject(this.ghost);
    }
    this.ghost = null;
    this.ghostItem = null;
    this.pointerState = null;
    this.controls.enabled = true;
  }

  _setGhostPosition(x, z, mode = 'place', itemId = null) {
    if (this.ghost) {
      this.ghost.position.set(x, 0, z);
      const valid = this.onPreview(this.ghostItem.id, { x, y: 0, z }, mode);
      ItemVisualFactory.setGhostValidity(this.ghost, valid);
      this.ghost.userData.valid = valid;
    }
    if (mode === 'move' && itemId) {
      const object = this.objectsById.get(itemId);
      if (object) object.position.set(x, object.position.y, z);
    }
  }

  _setPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _getFloorPosition(event) {
    this._setPointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.floor ? this.raycaster.intersectObject(this.floor)[0] : null;
    if (!hit) return null;
    return {
      x: THREE.MathUtils.clamp(hit.point.x, 0.05, this._roomSize.width - 0.05),
      y: 0,
      z: THREE.MathUtils.clamp(hit.point.z, 0.05, this._roomSize.depth - 0.05)
    };
  }

  _getItemHit(event) {
    this._setPointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.furnitureGroup.children, true)[0];
    if (!hit) return null;
    let object = hit.object;
    while (object && !object.userData.itemId) object = object.parent;
    return object?.userData.itemId ? object : null;
  }

  _handlePointerDown = event => {
    if (event.button !== 0) return;
    const point = { x: event.clientX, y: event.clientY };
    const itemHit = this._getItemHit(event);

    if (this.ghostItem) {
      const position = this._getFloorPosition(event);
      if (position) this._setGhostPosition(position.x, position.z);
      this.pointerState = { mode: 'place', pointerId: event.pointerId, start: point, moved: false };
      this.canvas.setPointerCapture?.(event.pointerId);
      this.controls.enabled = false;
      event.preventDefault();
      return;
    }

    if (itemHit) {
      this.onSelect(itemHit.userData.itemId);
      this.pointerState = {
        mode: 'move', itemId: itemHit.userData.itemId, pointerId: event.pointerId,
        start: point, moved: false, lastPosition: null
      };
      this.canvas.setPointerCapture?.(event.pointerId);
      this.controls.enabled = false;
      event.preventDefault();
      return;
    }

    this.pointerState = { mode: 'floor', pointerId: event.pointerId, start: point, moved: false };
  };

  _handlePointerMove = event => {
    const position = this._getFloorPosition(event);
    if (!position) return;

    if (this.ghostItem && !this.pointerState) {
      this._setGhostPosition(position.x, position.z);
      return;
    }
    if (!this.pointerState) return;

    const current = { x: event.clientX, y: event.clientY };
    if (distanceBetween(this.pointerState.start, current) > DRAG_THRESHOLD) this.pointerState.moved = true;

    if (this.pointerState.mode === 'place') {
      this._setGhostPosition(position.x, position.z);
      return;
    }
    if (this.pointerState.mode === 'move' && this.pointerState.moved) {
      this.pointerState.lastPosition = position;
      const object = this.objectsById.get(this.pointerState.itemId);
      if (object) {
        object.position.set(position.x, object.position.y, position.z);
        ItemVisualFactory.setPreviewValidity(object, true);
      }
    }
  };

  _handlePointerUp = event => {
    const state = this.pointerState;
    if (!state) return;
    const position = this._getFloorPosition(event) ?? state.lastPosition;
    this.pointerState = null;
    this.controls.enabled = true;
    this.canvas.releasePointerCapture?.(event.pointerId);
    if (!position) return;

    if (state.mode === 'place') {
      // The only rejected placement is outside the room boundary; overlap is valid.
      this.onPlace(this.ghostItem.id, position);
      return;
    }
    if (state.mode === 'move' && state.moved && state.lastPosition) {
      this.onMove(state.itemId, state.lastPosition);
      return;
    }
    if (state.mode === 'floor' && !state.moved) this.onFloorClick(position);
  };

  _handlePointerCancel = event => {
    const state = this.pointerState;
    if (!state) return;
    this.pointerState = null;
    this.controls.enabled = true;
    this.canvas.releasePointerCapture?.(event.pointerId);
    if (state.mode === 'move') this.onCancelMove(state.itemId);
    if (state.mode === 'place') this.cancelPlacement();
  };

  resetCamera() {
    if (!this._cameraHome) return;
    this.camera.position.copy(this._cameraHome.position);
    this.controls.target.copy(this._cameraHome.target);
    this.camera.lookAt(this.controls.target);
    this.controls.update();
  }

  _resize = () => {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  startRenderLoop() {
    const render = now => {
      this._tickAnimations(now);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this._animationFrame = requestAnimationFrame(render);
    };
    this._animationFrame = requestAnimationFrame(render);
  }

  destroy() {
    if (this._animationFrame) cancelAnimationFrame(this._animationFrame);
    this.cancelPlacement();
    this.canvas.removeEventListener('pointerdown', this._handlePointerDown);
    this.canvas.removeEventListener('pointermove', this._handlePointerMove);
    this.canvas.removeEventListener('pointerup', this._handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this._handlePointerCancel);
    window.removeEventListener('resize', this._resize);
    this.sceneLife?.destroy();
    this.controls.dispose();
    this.renderer.dispose();
    this.objectsById.clear();
  }
}
