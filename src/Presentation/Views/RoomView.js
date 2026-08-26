import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import ItemVisualFactory from '../Scene/ItemVisualFactory.js';
import SceneLifeSystem from '../Scene/SceneLifeSystem.js';
import { getWallOpacities } from '../Scene/WallVisibility.js';
import { getRoomOpenings } from '../Scene/RoomArchitecture.js';
import { resolveEnvironmentProfilePlan } from '../Scene/EnvironmentProfilePlan.js';
import { createPassageZoneOverlay } from '../Scene/PassageZoneOverlay.js';

const DRAG_THRESHOLD = 5;
const ANIMATION_MS = 220;

export function rendererSettingsFor(qualityTier) {
  if (qualityTier === 'performance') return { pixelRatioCap: 1, shadowsEnabled: false };
  return { pixelRatioCap: 2, shadowsEnabled: true };
}

export function isPrimaryInteractionPointer(event) {
  if (event?.pointerType === 'touch') return event.isPrimary !== false;
  return event?.button === 0;
}

function easeOutCubic(value) {
  return 1 - ((1 - value) ** 3);
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function scaleVector(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return { x: value, y: value, z: value };
  return {
    x: Number.isFinite(value?.x) ? value.x : 1,
    y: Number.isFinite(value?.y) ? value.y : 1,
    z: Number.isFinite(value?.z) ? value.z : 1
  };
}

function sameScaleVector(left, right) {
  const a = scaleVector(left);
  const b = scaleVector(right);
  return Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001 && Math.abs(a.z - b.z) < 0.001;
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
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
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
  constructor(canvas, { furnitureAssetRepository = null } = {}) {
    this.canvas = canvas;
    this.furnitureAssetRepository = furnitureAssetRepository;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b121b);
    this.scene.fog = new THREE.Fog(0x0b121b, 14, 32);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.playerSettings = { reducedMotion: false, uiScale: 'standard', qualityTier: 'balanced' };
    this._applyRendererSettings(this.playerSettings);
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this._pbrEnvironment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this._pbrEnvironment.texture;
    pmremGenerator.dispose();

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
    this.controls.minDistance = 4;
    this.controls.maxDistance = 16;
    // Right mouse button is reserved for deselection; middle mouse keeps panning.
    this.controls.mouseButtons.RIGHT = null;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.roomGroup = new THREE.Group();
    this.furnitureGroup = new THREE.Group();
    this.overlayGroup = new THREE.Group();
    this.scene.add(this.roomGroup, this.furnitureGroup, this.overlayGroup);
    this.floor = null;
    this.walls = [];
    this.objectsById = new Map();
    this.passageZones = [];
    this._highlightedIds = new Set();
    this.animations = new Set();
    this.ghost = null;
    this.ghostItem = null;
    this.ghostRotation = 0;
    this.pointerState = null;
    this._animationFrame = null;
    this._roomSize = { width: 8, depth: 6 };
    this._cameraHome = null;
    this.sceneLife = null;
    this.environmentPlan = null;
    this._presentationEnvironmentId = null;
    this._surfaceSignature = null;
    this.surfaceFinishesById = new Map();
    this.lights = {};

    this.onSelect = () => {};
    this.onPlace = () => {};
    this.onMove = () => {};
    this.onFloorClick = () => {};
    this.onCancelMove = () => {};
    this.onDeselect = () => {};
    this.onPreview = () => true;
  }

  _applyRendererSettings(settings) {
    const rendererSettings = rendererSettingsFor(settings.qualityTier);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, rendererSettings.pixelRatioCap));
    this.renderer.shadowMap.enabled = rendererSettings.shadowsEnabled;
    this.renderer.shadowMap.needsUpdate = true;
  }

  setRenderSettings(settings) {
    this.playerSettings = { ...settings };
    this._applyRendererSettings(this.playerSettings);
  }

  setPresentationEnvironment(environment) {
    this.environmentPlan = resolveEnvironmentProfilePlan(environment);
    this._applyEnvironmentLighting();
  }

  setSurfaceFinishes(finishes) {
    if (!Array.isArray(finishes)) throw new Error('RoomView surface finishes must be an array.');
    this.surfaceFinishesById = new Map(finishes.map(finish => [finish.id, finish]));
    this._surfaceSignature = null;
  }

  _resolveSurfacePlan(surfaceConfiguration) {
    const floor = this.surfaceFinishesById.get(surfaceConfiguration?.floorFinishId) ?? { id: 'fallback-floor', visual: { color: '#9d9388', roughness: 0.95, metalness: 0 } };
    const wall = this.surfaceFinishesById.get(surfaceConfiguration?.wallFinishId) ?? { id: 'fallback-wall', visual: { color: '#d5d2cb', roughness: 0.94, metalness: 0 } };
    if (floor.surface && floor.surface !== 'floor') throw new Error(`Surface finish ${floor.id} cannot be applied to floor.`);
    if (wall.surface && wall.surface !== 'wall') throw new Error(`Surface finish ${wall.id} cannot be applied to wall.`);
    return Object.freeze({ floor, wall, signature: `${floor.id}/${wall.id}` });
  }

  /** Shows the ergonomics passage zones (door/window/approach) as floor guides. */
  setPassageZones(zones = []) {
    this.passageZones = Array.isArray(zones) ? zones : [];
    this._rebuildPassageOverlay();
  }

  _rebuildPassageOverlay() {
    disposeObject(this.overlayGroup);
    this.overlayGroup.clear();
    if (this.passageZones.length > 0) this.overlayGroup.add(createPassageZoneOverlay(this.passageZones));
  }

  /** Tints the given room instances with the invalid feedback state. */
  highlightItems(instanceIds = []) {
    this._highlightedIds = new Set(instanceIds);
    for (const [id, object] of this.objectsById) {
      ItemVisualFactory.setPreviewValidity(object, !this._highlightedIds.has(id));
    }
  }

  clearHighlightedItems() {
    if (this._highlightedIds.size === 0) return;
    this._highlightedIds.clear();
    for (const object of this.objectsById.values()) {
      ItemVisualFactory.setPreviewValidity(object, true);
    }
  }

  async init() {
    this._createLights();
    this.canvas.addEventListener('pointerdown', this._handlePointerDown);
    this.canvas.addEventListener('pointermove', this._handlePointerMove);
    this.canvas.addEventListener('pointerup', this._handlePointerUp);
    this.canvas.addEventListener('pointercancel', this._handlePointerCancel);
    this.canvas.addEventListener('contextmenu', this._handleContextMenu);
    window.addEventListener('resize', this._resize);
    this._resize();
  }

  setInteractionHandlers({ onSelect, onPlace, onMove, onFloorClick, onCancelMove, onDeselect, onPreview }) {
    this.onSelect = onSelect ?? (() => {});
    this.onPlace = onPlace ?? (() => {});
    this.onMove = onMove ?? (() => {});
    this.onFloorClick = onFloorClick ?? (() => {});
    this.onCancelMove = onCancelMove ?? (() => {});
    this.onDeselect = onDeselect ?? (() => {});
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
    this.lights = { ambient, key, rim, warm };
    this._applyEnvironmentLighting();
  }

  _applyEnvironmentLighting() {
    if (!this.environmentPlan || !this.lights.ambient) return;
    const lighting = this.environmentPlan.lighting;
    this.scene.background.setHex(lighting.background);
    this.scene.fog.color.setHex(lighting.fog);
    this.lights.ambient.color.setHex(lighting.hemisphereSky);
    this.lights.ambient.groundColor.setHex(lighting.hemisphereGround);
    this.lights.ambient.intensity = lighting.hemisphereIntensity;
    this.lights.key.color.setHex(lighting.key);
    this.lights.key.intensity = lighting.keyIntensity;
    this.lights.rim.color.setHex(lighting.rim);
    this.lights.rim.intensity = lighting.rimIntensity;
    this.lights.warm.color.setHex(lighting.warm);
    this.lights.warm.intensity = lighting.warmIntensity;
  }

  _buildRoom(width, depth, surfaceConfiguration = null) {
    if (!this.environmentPlan) throw new Error('RoomView requires a presentation environment before rendering.');
    const plan = this.environmentPlan;
    const surfaces = this._resolveSurfacePlan(surfaceConfiguration);
    this._roomSize = { width, depth };
    this._presentationEnvironmentId = plan.id;
    this._surfaceSignature = surfaces.signature;
    disposeObject(this.roomGroup);
    this.roomGroup.clear();
    this.walls = [];
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      makeMaterial(surfaces.floor.visual.color, { roughness: surfaces.floor.visual.roughness, metalness: surfaces.floor.visual.metalness ?? 0 })
    );
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.set(width / 2, 0, depth / 2);
    this.floor.userData.kind = 'floor';
    this.floor.userData.surfaceStyle = surfaces.floor.id;
    this.floor.receiveShadow = true;
    this.roomGroup.add(this.floor);

    const wallMaterial = { color: surfaces.wall.visual.color, roughness: surfaces.wall.visual.roughness, metalness: surfaces.wall.visual.metalness ?? 0 };
    const wallHeight = 3.2;
    const openings = getRoomOpenings(width, depth, wallHeight, plan.openings);
    const windowOpening = openings.window;
    const windowLeft = windowOpening.centerX - windowOpening.width / 2;
    const windowRight = windowOpening.centerX + windowOpening.width / 2;
    const walls = [
      ['front', width, wallHeight, 0.08, width / 2, wallHeight / 2, 0],
      ['back', windowLeft, wallHeight, 0.08, windowLeft / 2, wallHeight / 2, depth],
      ['back', width - windowRight, wallHeight, 0.08, windowRight + (width - windowRight) / 2, wallHeight / 2, depth],
      ['back', windowOpening.width, windowOpening.bottom, 0.08, windowOpening.centerX, windowOpening.bottom / 2, depth],
      ['back', windowOpening.width, wallHeight - windowOpening.top, 0.08, windowOpening.centerX, (wallHeight + windowOpening.top) / 2, depth],
      ['left', 0.08, wallHeight, depth, 0, wallHeight / 2, depth / 2],
      ['right', 0.08, wallHeight, depth, width, wallHeight / 2, depth / 2]
    ];
    for (const [side, wallWidth, wallHeightValue, wallDepth, x, y, z] of walls) {
      const wall = addRoomBox(this.roomGroup, [wallWidth, wallHeightValue, wallDepth], [x, y, z], wallMaterial.color, wallMaterial);
      wall.userData.wallSide = side;
      this.walls.push(wall);
    }
    this._addRoomDecor(width, depth, wallHeight, plan);
    this._updateWallVisibility();
    this.sceneLife?.destroy();
    this.sceneLife = new SceneLifeSystem(this.scene, this.roomGroup, {
      width,
      depth,
      environmentPlan: this.environmentPlan
    });

    this._cameraHome = {
      position: new THREE.Vector3(width * plan.camera.xFactor, Math.max(plan.camera.minHeight, depth * plan.camera.heightFactor), depth * plan.camera.zFactor),
      target: new THREE.Vector3(width / 2, plan.camera.targetHeight, depth / 2)
    };
    this.resetCamera();
  }

  _addWallTreatment(width, depth, wallHeight, plan) {
    const treatment = plan.identity.wallTreatment;
    const openings = getRoomOpenings(width, depth, wallHeight, plan.openings);
    const backZ = depth - 0.052;
    const createDetail = (size, position, color, options = {}) => {
      const detail = addRoomBox(this.roomGroup, size, position, color, { castShadow: false, receiveShadow: false, ...options });
      detail.userData.kind = 'room-wall-treatment';
      detail.userData.wallTreatment = treatment.kind;
      return detail;
    };
    const addBackLowerBand = (color, height = 0.68) => {
      const lowerHeight = Math.min(height, openings.window.bottom - 0.1);
      if (lowerHeight <= 0.08) return;
      createDetail([width - 0.12, lowerHeight, 0.028], [width / 2, lowerHeight / 2, backZ], color, { roughness: 0.92 });
    };

    addBackLowerBand(treatment.wainscotColor);
    const sideRailY = 1.08;
    createDetail([0.032, 1.85, depth - 0.24], [0.052, sideRailY, depth / 2], treatment.wainscotColor, { roughness: 0.9 });
    createDetail([0.032, 1.85, depth - 0.24], [width - 0.052, sideRailY, depth / 2], treatment.wainscotColor, { roughness: 0.9 });

    if (treatment.kind === 'warm-linen-wainscot') {
      for (let index = 0; index < 5; index += 1) {
        const x = 0.52 + index * ((width - 1.04) / 4);
        createDetail([0.022, 1.54, 0.024], [x, 1.72, backZ - 0.016], treatment.trimColor, { roughness: 0.62, metalness: 0.05 });
      }
      createDetail([width - 0.18, 0.055, 0.045], [width / 2, 1.03, backZ - 0.018], treatment.trimColor, { roughness: 0.55 });
    }

    if (treatment.kind === 'midnight-graphic-wallpaper') {
      const motifX = [0.16, 0.36, 0.56, 0.76, 0.88].map(factor => width * factor);
      motifX.forEach((x, index) => {
        const motif = createDetail([0.14, 0.48 + (index % 2) * 0.18, 0.022], [x, 2.15 + (index % 2) * 0.12, backZ - 0.018], treatment.patternColor, { roughness: 0.5, emissive: treatment.patternColor, emissiveIntensity: 0.04 });
        motif.rotation.z = index % 2 ? Math.PI / 4 : -Math.PI / 4;
      });
      createDetail([width - 0.16, 0.04, 0.045], [width / 2, 0.92, backZ - 0.02], treatment.trimColor, { roughness: 0.38, metalness: 0.22 });
    }

    if (treatment.kind === 'sunwash-gallery-wall') {
      const panelWidth = Math.max(0.42, (width - 0.5) / 5);
      for (let index = 0; index < 5; index += 1) {
        const panel = createDetail([panelWidth - 0.05, 1.62, 0.024], [0.25 + panelWidth * (index + 0.5), 2.24, backZ - 0.017], index % 2 ? treatment.textileColor : treatment.patternColor, { roughness: 0.86, transparent: true, opacity: 0.46 });
        panel.userData.galleryPanel = index;
      }
      createDetail([width - 0.14, 0.045, 0.05], [width / 2, 1.42, backZ - 0.02], treatment.trimColor, { roughness: 0.5, metalness: 0.1 });
      for (const [index, zFactor] of [.24, .51, .78].entries()) {
        const panel = createDetail([0.026, 1.46, Math.max(.48, depth * .19)], [width - .051, 1.95, depth * zFactor], index % 2 ? treatment.patternColor : treatment.textileColor, { roughness: .72, transparent: true, opacity: .72 });
        panel.userData.gallerySidePanel = index;
      }
    }
  }

  _addRoomDecor(width, depth, wallHeight, plan) {
    // The window is a real opening in the back wall, not an opaque panel laid over it.
    const openings = getRoomOpenings(width, depth, wallHeight, plan.openings);
    const windowOpening = openings.window;
    const glass = addRoomBox(this.roomGroup, [windowOpening.width, windowOpening.height, 0.025], [windowOpening.centerX, windowOpening.bottom + windowOpening.height / 2, depth - 0.055], 0x8fc8d1, {
      roughness: 0.12,
      metalness: 0.08,
      transparent: true,
      opacity: windowOpening.glassOpacity,
      emissive: 0x2b7285,
      emissiveIntensity: 0.3,
      castShadow: false,
      receiveShadow: false
    });
    glass.material.depthWrite = false;
    const windowFrameColor = 0xd4aa72;
    addRoomBox(this.roomGroup, [windowOpening.width + 0.14, 0.08, 0.06], [windowOpening.centerX, windowOpening.bottom, depth - 0.08], windowFrameColor, { castShadow: false });
    addRoomBox(this.roomGroup, [windowOpening.width + 0.14, 0.08, 0.06], [windowOpening.centerX, windowOpening.top, depth - 0.08], windowFrameColor, { castShadow: false });
    for (const x of [windowOpening.centerX - windowOpening.width / 2, windowOpening.centerX + windowOpening.width / 2]) {
      addRoomBox(this.roomGroup, [0.08, windowOpening.height, 0.06], [x, windowOpening.bottom + windowOpening.height / 2, depth - 0.08], windowFrameColor, { castShadow: false });
    }
    addRoomBox(this.roomGroup, [0.07, windowOpening.height, 0.06], [windowOpening.centerX, windowOpening.bottom + windowOpening.height / 2, depth - 0.08], windowFrameColor, { castShadow: false });

    // A readable interior door sits on the left wall with frame, panel and handle.
    const door = openings.door;
    addRoomBox(this.roomGroup, [0.055, door.height, door.width], [0.065, door.height / 2, door.centerZ], door.color, { roughness: 0.48 });
    for (const [y, z, size] of [[door.height / 2, door.centerZ - door.width / 2, [0.07, door.height, 0.08]], [door.height / 2, door.centerZ + door.width / 2, [0.07, door.height, 0.08]], [door.height, door.centerZ, [0.07, 0.08, door.width + 0.12]]]) {
      addRoomBox(this.roomGroup, size, [0.1, y, z], 0xc19b69, { castShadow: false });
    }
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), makeMaterial(0xdab66d, { metalness: 0.65 }));
    handle.position.set(0.13, door.height * 0.52, door.centerZ - 0.23);
    this.roomGroup.add(handle);

  }

  _updateWallVisibility() {
    const opacities = getWallOpacities(this.camera.position, this._roomSize);
    for (const wall of this.walls) {
      const opacity = opacities[wall.userData.wallSide] ?? 1;
      const material = wall.material;
      material.transparent = opacity < 1;
      material.opacity = opacity;
      material.depthWrite = opacity >= 1;
    }
  }

  render(roomState, selectedItemId = null) {
    if (!roomState) return;
    const surfaces = this._resolveSurfacePlan(roomState.surfaceConfiguration);
    if (this._roomSize.width !== roomState.width || this._roomSize.depth !== roomState.depth || this._presentationEnvironmentId !== this.environmentPlan?.id || this._surfaceSignature !== surfaces.signature || !this.floor) {
      this._buildRoom(roomState.width, roomState.depth, roomState.surfaceConfiguration);
    }

    const activeIds = new Set();
    for (const placed of roomState.getItems()) {
      activeIds.add(placed.id);
      let object = this.objectsById.get(placed.id);
      if (!object) {
        object = ItemVisualFactory.create(placed.item, { configuration: placed.configuration });
        this._setObjectInstanceId(object, placed.id);
        object.position.set(placed.position.x, placed.position.y ?? 0, placed.position.z);
        object.rotation.y = THREE.MathUtils.degToRad(placed.rotation);
        object.scale.setScalar(0.01);
        this.objectsById.set(placed.id, object);
        this.furnitureGroup.add(object);
        this._upgradeVisualWithAsset(object, placed.item);
        this._animateScale(object, object.userData.variantScaleVector ?? object.userData.variantScale ?? 1);
      } else {
        this._setObjectInstanceId(object, placed.id);
        const previousVariantScale = object.userData.variantScaleVector ?? object.userData.variantScale ?? 1;
        ItemVisualFactory.applyConfiguration(object, placed.item, placed.configuration);
        const nextVariantScale = object.userData.variantScaleVector ?? object.userData.variantScale ?? 1;
        if (!sameScaleVector(previousVariantScale, nextVariantScale)) this._animateScale(object, nextVariantScale);
        this._animateTransform(object, placed.position, placed.rotation);
      }
      const highlighted = this._highlightedIds.size > 0 && this._highlightedIds.has(placed.id);
      // Apply selection first, then the evaluation state: an offending item
      // must remain visibly red even when it is also the active selection.
      ItemVisualFactory.setSelected(object, selectedItemId === placed.id);
      ItemVisualFactory.setPreviewValidity(object, !highlighted);
    }

    for (const [itemId, object] of this.objectsById) {
      if (!activeIds.has(itemId)) this._animateRemoval(itemId, object);
    }
  }

  _upgradeVisualWithAsset(object, item) {
    if (!this.furnitureAssetRepository?.hasItem(item.id)) return;
    object.userData.assetState = 'loading';
    this.furnitureAssetRepository.createForItemId(item.id)
      .then(asset => {
        if (!asset || object.userData.removing || !object.parent) return;
        ItemVisualFactory.attachAsset(object, asset);
      })
      .catch(() => {
        if (!object.userData.removing) object.userData.assetState = 'fallback';
      });
  }

  _setObjectInstanceId(object, instanceId) {
    object.userData.itemId = instanceId;
    object.traverse(child => {
      if (child.userData?.kind === 'item-part' || child.userData?.kind === 'item-hit-proxy') {
        child.userData.itemId = instanceId;
      }
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
    const initialScale = { x: object.scale.x, y: object.scale.y, z: object.scale.z };
    const target = scaleVector(targetScale);
    this._animate(ANIMATION_MS, progress => {
      const eased = easeOutCubic(progress);
      object.scale.set(
        initialScale.x + (target.x - initialScale.x) * eased,
        initialScale.y + (target.y - initialScale.y) * eased,
        initialScale.z + (target.z - initialScale.z) * eased
      );
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
    if (this.playerSettings.reducedMotion) {
      update(1);
      complete();
      return;
    }
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
    this.ghostRotation = 0;
    this.ghost = ItemVisualFactory.create(item, { ghost: true });
    this.ghost.position.set(this._roomSize.width / 2, 0, this._roomSize.depth / 2);
    this.ghost.rotation.y = 0;
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
    this.ghostRotation = 0;
    this.pointerState = null;
    this.controls.enabled = true;
  }

  _setGhostPosition(x, z, mode = 'place', itemId = null) {
    if (this.ghost) {
      this.ghost.position.set(x, 0, z);
      const valid = this.onPreview(this.ghostItem.id, { x, y: 0, z }, mode, this.ghostRotation);
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
    if (event.button === 2) {
      this.pointerState = null;
      this.controls.enabled = true;
      this.cancelPlacement();
      this.onDeselect();
      event.preventDefault();
      return;
    }
    if (!isPrimaryInteractionPointer(event)) return;
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
        mode: 'move',
        itemId: itemHit.userData.itemId,
        pointerId: event.pointerId,
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
      this.onPlace(this.ghostItem.id, position, this.ghostRotation);
      return;
    }
    if (state.mode === 'move' && state.moved && state.lastPosition) {
      this.onMove(state.itemId, state.lastPosition);
      return;
    }
    if (state.mode === 'floor' && !state.moved) this.onFloorClick(position);
  };

  _handleContextMenu = event => {
    event.preventDefault();
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

  rotateGhost(delta = 90) {
    if (!this.ghost) return false;
    this.ghostRotation = (this.ghostRotation + delta + 360) % 360;
    this.ghost.rotation.y = THREE.MathUtils.degToRad(this.ghostRotation);
    this._setGhostPosition(this.ghost.position.x, this.ghost.position.z);
    return true;
  }

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
      this._updateWallVisibility();
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
    this.canvas.removeEventListener('contextmenu', this._handleContextMenu);
    window.removeEventListener('resize', this._resize);
    this.sceneLife?.destroy();
    this._pbrEnvironment?.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.objectsById.clear();
  }
}
