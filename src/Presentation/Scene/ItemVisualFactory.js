import * as THREE from 'three';
import visualProfiles from '../../../data/visuals/item-visuals.json';

const COLORS = {
  wood: 0xb9855b,
  woodLight: 0xd6ad7a,
  fabric: 0x7b96ad,
  fabricWarm: 0x9b7d69,
  metal: 0x75879a,
  ceramic: 0xd9d0bc,
  glass: 0x9fc4d5,
  green: 0x78966d,
  rug: 0x927c70,
  dark: 0x33404d,
  brass: 0xd3a458,
  screen: 0x142b3d
};

function dimensionsOf(item) {
  return item.dimensions ?? { x: 1, z: 1 };
}

function heightOf(item, fallback = 1) {
  return Math.max(0.35, fallback * (0.7 + (item.featureVector?.sizeNorm ?? 0.5) * 0.55));
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function addBox(group, width, height, depth, x, y, z, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color, options));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addCylinder(group, radius, height, x, y, z, color, options = {}, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material(color, options));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addSphere(group, radius, x, y, z, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 10), material(color, options));
  mesh.position.set(x, y, z);
  mesh.scale.y = 0.8;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addLegs(group, width, depth, height, color, radius = 0.045) {
  const insetX = Math.max(0.08, width * 0.16);
  const insetZ = Math.max(0.08, depth * 0.16);
  for (const x of [-width / 2 + insetX, width / 2 - insetX]) {
    for (const z of [-depth / 2 + insetZ, depth / 2 - insetZ]) {
      addCylinder(group, radius, height, x, height / 2, z, color, { metalness: 0.15 });
    }
  }
}

function buildSofa(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const seatHeight = 0.42;
  addBox(group, width, seatHeight, depth * 0.7, 0, seatHeight / 2 + 0.18, depth * 0.08, COLORS.fabric);
  addBox(group, width * 0.96, 0.62, depth * 0.18, 0, 0.78, -depth * 0.31, COLORS.fabricWarm);
  addBox(group, width * 0.11, 0.7, depth * 0.8, -width * 0.445, 0.5, 0, COLORS.fabric);
  addBox(group, width * 0.11, 0.7, depth * 0.8, width * 0.445, 0.5, 0, COLORS.fabric);
  addLegs(group, width * 0.8, depth * 0.65, 0.18, COLORS.wood, 0.035);
}

function buildChair(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const seat = Math.min(0.48, heightOf(item, 0.58));
  addBox(group, width * 0.88, 0.16, depth * 0.82, 0, seat, 0, COLORS.fabricWarm);
  addBox(group, width * 0.82, seat * 1.35, 0.14, 0, seat + 0.62, -depth * 0.34, COLORS.woodLight);
  addLegs(group, width * 0.72, depth * 0.66, seat, COLORS.wood, 0.035);
}

function buildDiningTable(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const topHeight = 0.76;
  addBox(group, width, 0.13, depth, 0, topHeight, 0, COLORS.woodLight);
  addLegs(group, width * 0.86, depth * 0.82, topHeight - 0.05, COLORS.dark, 0.05);
}

function buildRoundTable(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const radius = Math.min(width, depth) * 0.5;
  const topHeight = 0.55;
  addCylinder(group, radius, 0.12, 0, topHeight, 0, COLORS.wood, { roughness: 0.58 }, 32);
  addCylinder(group, radius * 0.25, topHeight - 0.08, 0, (topHeight - 0.08) / 2, 0, COLORS.brass, { metalness: 0.5 }, 20);
  addCylinder(group, radius * 0.48, 0.08, 0, 0.04, 0, COLORS.dark, { metalness: 0.25 }, 24);
}

function buildLowTable(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addBox(group, width, 0.16, depth, 0, 0.44, 0, COLORS.wood);
  addLegs(group, width * 0.78, depth * 0.78, 0.38, COLORS.brass, 0.045);
}

function buildDesk(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addBox(group, width, 0.12, depth, 0, 0.76, 0, COLORS.woodLight);
  addBox(group, width * 0.08, 0.68, depth * 0.9, -width * 0.38, 0.37, 0, COLORS.dark);
  addBox(group, width * 0.08, 0.68, depth * 0.9, width * 0.38, 0.37, 0, COLORS.dark);
}

function buildLamp(group, item, shape = 'tableLamp') {
  const { x: width, z: depth } = dimensionsOf(item);
  const radius = Math.min(width, depth) * 0.32;
  const tall = shape === 'floorLamp' ? 1.65 : 0.92;
  addCylinder(group, radius * (shape === 'floorLamp' ? 1.3 : 1), 0.08, 0, 0.04, 0, COLORS.brass, { metalness: 0.65 });
  addCylinder(group, 0.035, tall * 0.72, 0, tall * 0.38, 0, COLORS.metal, { metalness: 0.65 });
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 1.2, shape === 'floorLamp' ? 0.48 : 0.38, 20, 1, true),
    material(COLORS.ceramic, { emissive: 0xffd995, emissiveIntensity: 0.32 })
  );
  shade.position.y = tall * 0.78;
  shade.rotation.x = Math.PI;
  shade.castShadow = true;
  group.add(shade);
}

function buildStorage(group, item, shape = 'storage') {
  const { x: width, z: depth } = dimensionsOf(item);
  const height = shape === 'wallShelf' ? 0.18 : heightOf(item, shape === 'cabinet' ? 1.0 : 1.7);
  if (shape === 'wallShelf') {
    addBox(group, width, height, depth, 0, 1.35, 0, COLORS.woodLight);
    addBox(group, width * 0.88, 0.05, depth * 0.9, 0, 1.48, 0, COLORS.brass, { metalness: 0.45 });
    return;
  }
  addBox(group, width, height, depth, 0, height / 2, 0, COLORS.wood);
  const shelfCount = shape === 'cabinet' ? 1 : 2;
  for (let index = 1; index <= shelfCount; index += 1) {
    const y = (height / (shelfCount + 1)) * index;
    addBox(group, width * 0.9, 0.035, depth * 0.96, 0, y, depth * 0.02, COLORS.woodLight);
  }
  addBox(group, width * 0.05, height * 0.08, depth * 0.08, width * 0.25, height * 0.52, -depth * 0.52, COLORS.brass, { metalness: 0.7 });
}

function buildBed(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addBox(group, width, 0.28, depth, 0, 0.28, 0, COLORS.wood);
  addBox(group, width * 0.94, 0.22, depth * 0.82, 0, 0.52, 0.02, COLORS.fabric);
  addBox(group, width * 0.98, 0.8, 0.12, 0, 0.68, -depth * 0.44, COLORS.woodLight);
  addLegs(group, width * 0.82, depth * 0.78, 0.18, COLORS.dark, 0.04);
}

function buildPlant(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const radius = Math.min(width, depth) * 0.42;
  addCylinder(group, radius, 0.35, 0, 0.175, 0, COLORS.ceramic, {}, 20);
  addCylinder(group, 0.035, 0.7, 0, 0.7, 0, COLORS.green, {}, 10);
  for (const [x, y, z, scale] of [[-0.16, 0.85, 0, 0.22], [0.14, 0.95, 0.04, 0.25], [0, 1.2, -0.02, 0.28]]) {
    addSphere(group, scale, x, y, z, COLORS.green);
  }
}

function buildMirror(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const frameWidth = Math.max(0.06, Math.min(width, depth) * 0.18);
  addBox(group, width, 1.45, frameWidth, 0, 0.73, 0, COLORS.wood, { metalness: 0.05 });
  addBox(group, width * 0.82, 1.2, 0.025, 0, 0.74, -frameWidth * 0.55, COLORS.glass, { metalness: 0.15, roughness: 0.2 });
}

function buildRug(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addBox(group, width, 0.035, depth, 0, 0.018, 0, COLORS.rug, { roughness: 0.95 });
  addBox(group, width * 0.9, 0.04, depth * 0.9, 0, 0.042, 0, COLORS.fabricWarm, { roughness: 0.95 });
}

function buildDecor(group, item) {
  const name = `${item.id} ${item.name}`.toLowerCase();
  if (name.includes('plant') || name.includes('растен')) return buildPlant(group, item);
  if (name.includes('mirror') || name.includes('зеркал')) return buildMirror(group, item);
  if (name.includes('rug') || name.includes('ковер')) return buildRug(group, item);
  if (name.includes('clock') || name.includes('час')) {
    const { x: width } = dimensionsOf(item);
    addCylinder(group, Math.max(0.12, width * 0.38), 0.08, 0, 0.08, 0, COLORS.ceramic, { metalness: 0.2 }, 24);
    return;
  }
  addCylinder(group, Math.min(dimensionsOf(item).x, dimensionsOf(item).z) * 0.35, 0.48, 0, 0.24, 0, COLORS.ceramic, {}, 16);
}

function profileFor(item) {
  const profile = visualProfiles.items[item.id];
  const defaultShape = visualProfiles.defaults[item.type] ?? 'decor';
  return { shape: defaultShape, ...profile };
}

function applyProfile(group, profile) {
  const color = COLORS[profile.material];
  group.userData.materialKey = profile.material ?? null;
  group.userData.accentKey = profile.accent ?? null;
  if (color === undefined) return;
  let primaryApplied = false;
  group.traverse(object => {
    if (primaryApplied || !object.isMesh || !object.material?.color) return;
    object.material.color.setHex(color);
    object.userData.baseColor = color;
    primaryApplied = true;
  });
}

function buildShape(group, item, profile) {
  switch (profile.shape) {
    case 'sofa': return buildSofa(group, item);
    case 'chair': return buildChair(group, item);
    case 'diningTable': return buildDiningTable(group, item);
    case 'roundTable': return buildRoundTable(group, item);
    case 'lowTable': return buildLowTable(group, item);
    case 'desk': return buildDesk(group, item);
    case 'tableLamp':
    case 'floorLamp':
    case 'ceilingLamp': return buildLamp(group, item, profile.shape);
    case 'wallShelf':
    case 'bookcase':
    case 'cabinet': return buildStorage(group, item, profile.shape);
    case 'bed': return buildBed(group, item);
    case 'plant': return buildPlant(group, item);
    case 'mirror': return buildMirror(group, item);
    case 'rug': return buildRug(group, item);
    case 'decor':
    default: return buildDecor(group, item);
  }
}

export class ItemVisualFactory {
  static create(item, { ghost = false } = {}) {
    const group = new THREE.Group();
    const profile = profileFor(item);
    group.userData.itemId = item.id;
    group.userData.catalogItemId = item.id;
    group.userData.visualShape = profile.shape;
    buildShape(group, item, profile);
    applyProfile(group, profile);
    if (profile.light) {
      const light = new THREE.PointLight(
        profile.light.color ?? 0xffd38c,
        profile.light.intensity ?? 1,
        profile.light.range ?? 3
      );
      light.position.y = 1;
      light.castShadow = false;
      group.add(light);
    }

    group.traverse(object => {
      if (!object.isMesh) return;
      object.userData.itemId = item.id;
      object.userData.catalogItemId = item.id;
      object.userData.kind = 'item-part';
      object.userData.baseColor = object.material.color.getHex();
    });

    if (ghost) ItemVisualFactory.setGhost(group, true);
    return group;
  }

  static setSelected(group, selected) {
    group?.traverse(object => {
      if (!object.isMesh || !object.material?.emissive) return;
      object.material.emissive.setHex(selected ? 0x2f6fc5 : 0x000000);
      object.material.emissiveIntensity = selected ? 0.55 : 0;
    });
  }

  static setGhost(group, ghost, valid = true) {
    group?.traverse(object => {
      if (!object.isMesh || !object.material) return;
      object.material.transparent = ghost;
      object.material.opacity = ghost ? 0.42 : 1;
      object.material.depthWrite = !ghost;
      if (ghost) {
        object.material.color.setHex(valid ? 0x63d99b : 0xff806d);
        object.material.emissive.setHex(valid ? 0x1e8f5a : 0x9c3329);
        object.material.emissiveIntensity = 0.25;
      }
    });
  }

  static setGhostValidity(group, valid) { ItemVisualFactory.setGhost(group, true, valid); }

  static setPreviewValidity(group, valid) {
    group?.traverse(object => {
      if (!object.isMesh || !object.material) return;
      object.material.color.setHex(valid ? object.userData.baseColor : 0xff806d);
      object.material.emissive.setHex(valid ? 0x000000 : 0x9c3329);
      object.material.emissiveIntensity = valid ? 0 : 0.35;
    });
  }
}

export default ItemVisualFactory;
