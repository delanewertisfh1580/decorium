import * as THREE from 'three';
import visualProfiles from '../../../data/visuals/item-visuals.json';

export const VISUAL_DETAIL_CONTRACT = Object.freeze({
  detailLevel: 'rich',
  minimumParts: 5,
  feedbackStates: Object.freeze(['idle', 'selected', 'valid', 'warning', 'invalid'])
});

const COLORS = {
  wood: 0xb9855b,
  woodLight: 0xd6ad7a,
  woodDark: 0x65483b,
  fabric: 0x718ba4,
  fabricWarm: 0x9b7d69,
  fabricLight: 0xb8c7ca,
  metal: 0x75879a,
  metalDark: 0x34434d,
  ceramic: 0xd9d0bc,
  glass: 0x9fc4d5,
  green: 0x78966d,
  greenLight: 0xa6c78c,
  rug: 0x927c70,
  rugLight: 0xc2a695,
  dark: 0x33404d,
  brass: 0xd3a458,
  brassLight: 0xf0ca7c,
  screen: 0x142b3d,
  black: 0x161e25,
  white: 0xf4eee3,
  terracotta: 0xb86f59
};

const FEEDBACK = Object.freeze({
  selected: { color: 0x6ca9ff, opacity: 0.78 },
  valid: { color: 0x63d99b, opacity: 0.68 },
  warning: { color: 0xf0c477, opacity: 0.72 },
  invalid: { color: 0xff806d, opacity: 0.82 }
});

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
    emissiveIntensity: options.emissiveIntensity ?? 0,
    side: options.side ?? THREE.FrontSide
  });
}

function part(mesh, group, name = null) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.kind = 'item-part';
  if (name) mesh.name = name;
  group.add(mesh);
  return mesh;
}

function addBox(group, width, height, depth, x, y, z, color, options = {}, name = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color, options));
  mesh.position.set(x, y, z);
  return part(mesh, group, name);
}

function addCylinder(group, radius, height, x, y, z, color, options = {}, segments = 20, name = null) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material(color, options));
  mesh.position.set(x, y, z);
  return part(mesh, group, name);
}

function addCone(group, radiusTop, radiusBottom, height, x, y, z, color, options = {}, segments = 20, name = null) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radiusTop, height, segments), material(color, options));
  mesh.position.set(x, y, z);
  return part(mesh, group, name);
}

function addSphere(group, radius, x, y, z, color, options = {}, scale = [1, 0.8, 1], name = null) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), material(color, options));
  mesh.position.set(x, y, z);
  mesh.scale.set(...scale);
  return part(mesh, group, name);
}

function addTorus(group, radius, tube, x, y, z, color, rotation = [0, 0, 0], options = {}, name = null) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 28), material(color, options));
  mesh.position.set(x, y, z);
  mesh.rotation.set(...rotation);
  return part(mesh, group, name);
}

function addLegs(group, width, depth, height, color, radius = 0.045) {
  const insetX = Math.max(0.08, width * 0.16);
  const insetZ = Math.max(0.08, depth * 0.16);
  for (const x of [-width / 2 + insetX, width / 2 - insetX]) {
    for (const z of [-depth / 2 + insetZ, depth / 2 - insetZ]) {
      addCylinder(group, radius, height, x, height / 2, z, color, { metalness: 0.15 }, 12, 'leg');
      addSphere(group, radius * 1.35, x, height + radius * 0.45, z, color, {}, [1, 0.55, 1], 'foot');
    }
  }
}

function buildSofa(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const seatY = 0.48;
  addBox(group, width, 0.34, depth * 0.72, 0, seatY, depth * 0.06, COLORS.fabric, {}, 'sofa-base');
  for (const x of [-width * 0.24, width * 0.24]) {
    addBox(group, width * 0.42, 0.16, depth * 0.56, x, seatY + 0.23, depth * 0.08, COLORS.fabricLight, { roughness: 0.9 }, 'seat-cushion');
    addTorus(group, width * 0.14, 0.012, x, seatY + 0.315, depth * 0.08, COLORS.fabricWarm, [Math.PI / 2, 0, 0], { roughness: 0.95 }, 'cushion-seam');
  }
  addBox(group, width * 0.96, 0.58, depth * 0.16, 0, 0.86, -depth * 0.3, COLORS.fabricWarm, {}, 'sofa-back');
  for (const x of [-width * 0.445, width * 0.445]) {
    addBox(group, width * 0.11, 0.72, depth * 0.78, x, 0.55, 0, COLORS.fabric, {}, 'sofa-arm');
    addBox(group, width * 0.13, 0.06, depth * 0.82, x, 0.9, 0, COLORS.fabricLight, { roughness: 0.9 }, 'arm-piping');
  }
  addLegs(group, width * 0.8, depth * 0.64, 0.18, COLORS.woodDark, 0.035);
}

function buildChair(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const seat = Math.min(0.52, heightOf(item, 0.62));
  addBox(group, width * 0.88, 0.15, depth * 0.82, 0, seat, 0, COLORS.fabricWarm, {}, 'chair-seat');
  addBox(group, width * 0.82, 0.06, depth * 0.72, 0, seat + 0.095, 0, COLORS.fabricLight, { roughness: 0.94 }, 'chair-cushion');
  addBox(group, width * 0.82, seat * 1.35, 0.14, 0, seat + 0.62, -depth * 0.34, COLORS.woodLight, {}, 'chair-back');
  addBox(group, width * 0.68, 0.06, 0.08, 0, seat + 0.45, -depth * 0.37, COLORS.fabricWarm, {}, 'chair-rail');
  addLegs(group, width * 0.72, depth * 0.66, seat, COLORS.woodDark, 0.035);
}

function buildDiningChair(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const seatY = Math.min(0.5, heightOf(item, 0.58));
  addBox(group, width * 0.84, 0.12, depth * 0.8, 0, seatY, 0.02, COLORS.fabricLight, { roughness: 0.9 }, 'dining-seat-frame');
  addBox(group, width * 0.94, 0.055, depth * 0.88, 0, seatY - 0.09, 0.02, COLORS.woodLight, {}, 'dining-seat-rail');
  addLegs(group, width * 0.82, depth * 0.78, seatY - 0.03, COLORS.wood, 0.03);
  addBox(group, 0.06, seatY * 1.9, 0.06, -width * 0.37, seatY + seatY * 0.82, -depth * 0.34, COLORS.woodLight, {}, 'dining-back-post');
  addBox(group, 0.06, seatY * 1.9, 0.06, width * 0.37, seatY + seatY * 0.82, -depth * 0.34, COLORS.woodLight, {}, 'dining-back-post');
  addBox(group, width * 0.82, 0.06, 0.06, 0, seatY + seatY * 1.67, -depth * 0.34, COLORS.woodLight, {}, 'dining-back-rail');
  for (const x of [-width * 0.22, 0, width * 0.22]) addBox(group, 0.035, seatY * 1.08, 0.045, x, seatY + seatY * 1.08, -depth * 0.34, COLORS.wood, {}, 'dining-slat');
}

function buildLoungeArmchair(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const seatY = 0.38;
  addBox(group, width * 0.86, 0.23, depth * 0.76, 0, seatY, depth * 0.05, COLORS.fabric, { roughness: 0.9 }, 'lounge-seat');
  addBox(group, width * 0.78, 0.17, depth * 0.62, 0, seatY + 0.17, depth * 0.03, COLORS.fabricLight, { roughness: 0.94 }, 'lounge-seat-cushion');
  const back = addBox(group, width * 0.78, 0.66, depth * 0.18, 0, 0.78, -depth * 0.29, COLORS.fabricLight, { roughness: 0.92 }, 'lounge-back-cushion');
  back.rotation.x = -0.1;
  for (const x of [-width * 0.42, width * 0.42]) {
    const arm = addBox(group, width * 0.16, 0.48, depth * 0.78, x, 0.53, 0, COLORS.fabric, { roughness: 0.9 }, 'lounge-arm');
    arm.rotation.z = x < 0 ? -0.04 : 0.04;
  }
  addLegs(group, width * 0.72, depth * 0.66, 0.16, COLORS.woodDark, 0.045);
}

function buildOfficeChair(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const seatY = 0.62;
  addBox(group, width * 0.82, 0.14, depth * 0.78, 0, seatY, 0.02, COLORS.dark, { roughness: 0.62 }, 'office-seat');
  const back = addBox(group, width * 0.74, 0.8, 0.12, 0, 1.14, -depth * 0.31, COLORS.dark, { roughness: 0.64 }, 'office-ergonomic-back');
  back.rotation.x = -0.08;
  addCylinder(group, 0.055, seatY - 0.1, 0, (seatY - 0.1) / 2, 0, COLORS.metalDark, { metalness: 0.65 }, 12, 'office-gas-lift');
  addCylinder(group, Math.min(width, depth) * 0.29, 0.08, 0, 0.04, 0, COLORS.metalDark, { metalness: 0.58 }, 20, 'office-base');
  for (let index = 0; index < 5; index += 1) {
    const angle = (Math.PI * 2 * index) / 5;
    const spoke = addBox(group, Math.min(width, depth) * 0.56, 0.05, 0.07, 0, 0.11, 0, COLORS.metalDark, { metalness: 0.62 }, 'office-spoke');
    spoke.rotation.y = angle;
    const radius = Math.min(width, depth) * 0.29;
    const wheel = addCylinder(group, 0.07, 0.055, Math.cos(angle) * radius, 0.08, Math.sin(angle) * radius, COLORS.black, { roughness: 0.7 }, 12, 'office-wheel');
    wheel.rotation.z = Math.PI / 2;
  }
  for (const x of [-width * 0.44, width * 0.44]) {
    addBox(group, 0.05, 0.25, 0.05, x, 0.75, -depth * 0.02, COLORS.metalDark, { metalness: 0.5 }, 'office-arm-support');
    addBox(group, width * 0.16, 0.06, depth * 0.2, x, 0.88, 0, COLORS.dark, { roughness: 0.7 }, 'office-armrest');
  }
}

function buildOttoman(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const radius = Math.min(width, depth) * 0.44;
  addCylinder(group, radius, 0.34, 0, 0.24, 0, COLORS.fabricWarm, { roughness: 0.88 }, 20, 'ottoman-body');
  addTorus(group, radius * 0.9, 0.02, 0, 0.42, 0, COLORS.fabricLight, [0, 0, 0], { roughness: 0.92 }, 'ottoman-seam');
  addCylinder(group, radius * 0.72, 0.055, 0, 0.44, 0, COLORS.fabricWarm, { roughness: 0.92 }, 20, 'ottoman-top');
  for (const [x, z] of [[-radius * 0.55, -radius * 0.55], [radius * 0.55, -radius * 0.55], [-radius * 0.55, radius * 0.55], [radius * 0.55, radius * 0.55]]) addCylinder(group, 0.04, 0.11, x, 0.055, z, COLORS.woodDark, {}, 10, 'ottoman-foot');
}

function buildEntryBench(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addBox(group, width * 0.9, 0.15, depth * 0.72, 0, 0.5, 0, COLORS.fabricWarm, { roughness: 0.9 }, 'bench-seat');
  for (const x of [-width * 0.42, width * 0.42]) {
    addBox(group, 0.07, 0.72, depth * 0.82, x, 0.36, 0, COLORS.woodLight, {}, 'bench-side-frame');
    addBox(group, 0.12, 0.06, depth * 0.88, x, 0.66, 0, COLORS.wood, {}, 'bench-top-rail');
  }
  addBox(group, width * 0.78, 0.05, depth * 0.66, 0, 0.18, 0, COLORS.woodLight, {}, 'bench-lower-shelf');
  for (const x of [-width * 0.28, 0, width * 0.28]) addBox(group, 0.04, 0.025, depth * 0.6, x, 0.23, 0, COLORS.wood, {}, 'bench-lower-slat');
}

function buildBarStool(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const radius = Math.min(width, depth) * 0.3;
  addCylinder(group, radius, 0.12, 0, 0.92, 0, COLORS.fabric, { roughness: 0.86 }, 20, 'stool-seat');
  addCylinder(group, 0.045, 0.84, 0, 0.46, 0, COLORS.metalDark, { metalness: 0.65 }, 12, 'stool-column');
  addTorus(group, radius * 0.92, 0.025, 0, 0.45, 0, COLORS.brass, [0, 0, 0], { metalness: 0.6 }, 'stool-footrest');
  addCylinder(group, radius * 0.82, 0.07, 0, 0.035, 0, COLORS.metalDark, { metalness: 0.52 }, 20, 'stool-base');
  addTorus(group, radius * 0.8, 0.02, 0, 0.98, 0, COLORS.fabricLight, [0, 0, 0], { roughness: 0.92 }, 'stool-seat-piping');
}

function buildClassicArmchair(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addBox(group, width * 0.78, 0.24, depth * 0.72, 0, 0.48, 0.04, COLORS.green, { roughness: 0.85 }, 'classic-seat');
  addBox(group, width * 0.75, 0.78, depth * 0.18, 0, 0.98, -depth * 0.29, COLORS.green, { roughness: 0.85 }, 'classic-tufted-back');
  for (const x of [-width * 0.21, 0, width * 0.21]) for (const y of [0.88, 1.1]) addSphere(group, 0.032, x, y, -depth * 0.39, COLORS.brass, { metalness: 0.52 }, [1, 1, 0.45], 'classic-tuft');
  for (const x of [-width * 0.43, width * 0.43]) {
    addSphere(group, width * 0.13, x, 0.72, 0, COLORS.green, { roughness: 0.86 }, [0.8, 1.1, 1.15], 'classic-rolled-arm');
    addBox(group, width * 0.15, 0.46, depth * 0.72, x, 0.48, 0, COLORS.green, { roughness: 0.86 }, 'classic-arm-base');
    addCylinder(group, 0.055, 0.25, x, 0.125, -depth * 0.26, COLORS.woodDark, {}, 10, 'classic-carved-foot');
  }
  addLegs(group, width * 0.72, depth * 0.62, 0.18, COLORS.woodDark, 0.045);
}

function buildSectionalSofa(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const seatY = 0.42;
  addBox(group, width * 0.62, 0.26, depth * 0.7, -width * 0.18, seatY, depth * 0.08, COLORS.fabric, {}, 'sectional-main-seat');
  addBox(group, width * 0.42, 0.26, depth * 0.98, width * 0.28, seatY, depth * 0.17, COLORS.fabric, {}, 'sectional-chaise');
  addBox(group, width * 0.96, 0.53, depth * 0.15, 0, 0.78, -depth * 0.31, COLORS.fabricWarm, {}, 'sectional-back');
  for (const [x, z, w, d] of [[-width * 0.28, depth * 0.08, width * 0.28, depth * 0.5], [width * 0.05, depth * 0.08, width * 0.28, depth * 0.5], [width * 0.3, depth * 0.2, width * 0.28, depth * 0.68]]) addBox(group, w, 0.14, d, x, seatY + 0.18, z, COLORS.fabricLight, { roughness: 0.92 }, 'sectional-cushion');
  addBox(group, width * 0.12, 0.56, depth * 0.74, -width * 0.45, 0.56, 0, COLORS.fabric, {}, 'sectional-arm');
  addLegs(group, width * 0.8, depth * 0.76, 0.16, COLORS.woodDark, 0.04);
}

function buildStraightSofa(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const seatY = 0.44;
  addBox(group, width * 0.9, 0.28, depth * 0.7, 0, seatY, depth * 0.05, COLORS.fabricWarm, {}, 'straight-sofa-base');
  addBox(group, width * 0.96, 0.56, depth * 0.16, 0, 0.82, -depth * 0.3, COLORS.fabric, {}, 'straight-sofa-back');
  for (const x of [-width * 0.28, 0, width * 0.28]) addBox(group, width * 0.25, 0.15, depth * 0.52, x, seatY + 0.2, depth * 0.08, COLORS.fabricLight, { roughness: 0.92 }, 'straight-sofa-cushion');
  for (const x of [-width * 0.45, width * 0.45]) addBox(group, width * 0.11, 0.58, depth * 0.76, x, 0.55, 0, COLORS.fabricWarm, {}, 'straight-sofa-arm');
  addLegs(group, width * 0.8, depth * 0.62, 0.16, COLORS.woodDark, 0.035);
}

function buildComputerDesk(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addBox(group, width, 0.11, depth, 0, 0.74, 0, COLORS.woodLight, {}, 'computer-desk-top');
  for (const x of [-width * 0.42, width * 0.42]) addBox(group, 0.06, 0.68, depth * 0.88, x, 0.36, 0, COLORS.metalDark, { metalness: 0.55 }, 'computer-desk-side-frame');
  addBox(group, width * 0.56, 0.09, depth * 0.28, 0, 0.96, -depth * 0.22, COLORS.wood, {}, 'monitor-shelf');
  addBox(group, width * 0.7, 0.04, 0.06, 0, 0.61, depth * 0.31, COLORS.metalDark, { metalness: 0.6 }, 'cable-channel');
  for (const x of [-width * 0.22, width * 0.22]) addCylinder(group, 0.03, 0.03, x, 0.8, depth * 0.18, COLORS.black, { metalness: 0.35 }, 12, 'cable-grommet');
}

function buildSideboard(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const height = 0.78;
  addBox(group, width, height, depth, 0, height / 2 + 0.13, 0, COLORS.woodDark, {}, 'sideboard-body');
  for (const x of [-width * 0.25, width * 0.25]) {
    addBox(group, width * 0.42, height * 0.7, 0.04, x, height * 0.5 + 0.13, -depth * 0.52, COLORS.wood, { roughness: 0.78 }, 'sideboard-door');
    addCylinder(group, 0.025, 0.05, x + (x < 0 ? width * 0.1 : -width * 0.1), height * 0.5 + 0.13, -depth * 0.57, COLORS.brass, { metalness: 0.7 }, 10, 'sideboard-pull');
  }
  for (const x of [-width * 0.4, width * 0.4]) addCylinder(group, 0.045, 0.26, x, 0.13, depth * 0.31, COLORS.woodDark, {}, 10, 'sideboard-foot');
  addBox(group, width * 0.94, 0.06, depth * 0.94, 0, height + 0.16, 0, COLORS.woodLight, {}, 'sideboard-top');
}

function buildMediaConsole(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const height = 0.48;
  addBox(group, width, height, depth, 0, height / 2 + 0.1, 0, COLORS.dark, { roughness: 0.58 }, 'media-console-body');
  addBox(group, width * 0.44, height * 0.42, depth * 0.08, 0, height * 0.54 + 0.1, -depth * 0.54, COLORS.black, { roughness: 0.85 }, 'media-bay');
  for (const x of [-width * 0.08, width * 0.08]) addCylinder(group, 0.025, 0.025, x, height * 0.54 + 0.1, -depth * 0.59, COLORS.black, {}, 10, 'cable-slot');
  for (const x of [-width * 0.4, width * 0.4]) addCylinder(group, 0.035, 0.2, x, 0.1, depth * 0.28, COLORS.metalDark, { metalness: 0.5 }, 10, 'media-console-foot');
  addBox(group, width * 0.94, 0.05, depth * 0.94, 0, height + 0.13, 0, COLORS.woodDark, {}, 'media-console-top');
}

function buildNightstand(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const height = 0.58;
  addBox(group, width, height, depth, 0, height / 2 + 0.12, 0, COLORS.woodLight, {}, 'nightstand-body');
  addBox(group, width * 0.78, height * 0.38, 0.04, 0, height * 0.58 + 0.12, -depth * 0.54, COLORS.wood, { roughness: 0.8 }, 'nightstand-drawer');
  addCylinder(group, 0.026, 0.05, 0, height * 0.58 + 0.12, -depth * 0.59, COLORS.brass, { metalness: 0.7 }, 10, 'nightstand-pull');
  addBox(group, width * 0.82, 0.04, depth * 0.82, 0, height * 0.27 + 0.12, depth * 0.03, COLORS.woodDark, {}, 'nightstand-shelf');
  addLegs(group, width * 0.78, depth * 0.72, 0.2, COLORS.woodDark, 0.035);
}

function buildDiningTable(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const topHeight = 0.76;
  addBox(group, width, 0.13, depth, 0, topHeight, 0, COLORS.woodLight, {}, 'tabletop');
  addBox(group, width * 0.92, 0.035, depth * 0.92, 0, topHeight + 0.085, 0, COLORS.wood, { roughness: 0.55 }, 'table-inlay');
  addLegs(group, width * 0.86, depth * 0.82, topHeight - 0.05, COLORS.metalDark, 0.05);
  addBox(group, width * 0.5, 0.05, 0.06, 0, topHeight - 0.22, 0, COLORS.metalDark, { metalness: 0.5 }, 'table-crossbar');
}

function buildRoundTable(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const radius = Math.min(width, depth) * 0.5;
  const topHeight = 0.55;
  addCylinder(group, radius, 0.12, 0, topHeight, 0, COLORS.wood, { roughness: 0.58 }, 32, 'round-top');
  addTorus(group, radius * 0.88, 0.025, 0, topHeight + 0.065, 0, COLORS.brassLight, [0, 0, 0], { metalness: 0.55 }, 'round-edge');
  addCylinder(group, radius * 0.25, topHeight - 0.08, 0, (topHeight - 0.08) / 2, 0, COLORS.brass, { metalness: 0.5 }, 20, 'round-column');
  addTorus(group, radius * 0.18, 0.018, 0, topHeight + 0.07, 0, COLORS.brassLight, [0, 0, 0], { metalness: 0.55 }, 'round-inlay');
  addCylinder(group, radius * 0.48, 0.08, 0, 0.04, 0, COLORS.dark, { metalness: 0.25 }, 24, 'round-base');
}

function buildLowTable(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addBox(group, width, 0.16, depth, 0, 0.44, 0, COLORS.wood, {}, 'low-top');
  addBox(group, width * 0.86, 0.04, depth * 0.84, 0, 0.54, 0, COLORS.woodLight, { roughness: 0.56 }, 'low-inlay');
  addLegs(group, width * 0.78, depth * 0.78, 0.38, COLORS.brass, 0.045);
}

function buildDesk(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addBox(group, width, 0.12, depth, 0, 0.76, 0, COLORS.woodLight, {}, 'desk-top');
  addBox(group, width * 0.72, 0.035, depth * 0.72, 0, 0.84, 0, COLORS.wood, { roughness: 0.56 }, 'desk-inlay');
  for (const x of [-width * 0.38, width * 0.38]) {
    addBox(group, width * 0.08, 0.68, depth * 0.9, x, 0.37, 0, COLORS.dark, {}, 'desk-side');
    addBox(group, width * 0.16, 0.035, depth * 0.58, x, 0.55, -depth * 0.08, COLORS.metal, { metalness: 0.48 }, 'desk-rail');
  }
  addBox(group, width * 0.22, 0.04, depth * 0.1, 0, 0.84, depth * 0.28, COLORS.brass, { metalness: 0.45 }, 'desk-handle');
}

function buildLamp(group, item, shape = 'tableLamp') {
  const { x: width, z: depth } = dimensionsOf(item);
  const radius = Math.max(0.12, Math.min(width, depth) * 0.32);
  const tall = shape === 'floorLamp' ? 1.65 : shape === 'ceilingLamp' ? 1.75 : 0.92;
  addCylinder(group, radius * (shape === 'floorLamp' ? 1.3 : 1), 0.08, 0, 0.04, 0, COLORS.brass, { metalness: 0.65 }, 24, 'lamp-base');
  addTorus(group, radius * 0.8, 0.018, 0, 0.09, 0, COLORS.brassLight, [0, 0, 0], { metalness: 0.55 }, 'lamp-base-ring');
  addCylinder(group, 0.035, tall * 0.72, 0, tall * 0.38, 0, COLORS.metal, { metalness: 0.65 }, 12, 'lamp-stem');
  if (shape === 'ceilingLamp') addCylinder(group, 0.018, 0.35, 0, tall + 0.12, 0, COLORS.metalDark, { metalness: 0.55 }, 8, 'lamp-cord');
  addCone(group, radius * 1.2, radius * 0.72, shape === 'floorLamp' ? 0.48 : 0.38, 0, tall * 0.78, 0, COLORS.ceramic, { emissive: 0xffd995, emissiveIntensity: 0.32, side: THREE.DoubleSide }, 24, 'lamp-shade');
  addSphere(group, radius * 0.3, 0, tall * 0.78 - 0.03, 0, COLORS.brassLight, { emissive: 0xffc76c, emissiveIntensity: 0.9 }, [1, 0.7, 1], 'lamp-bulb');
}

function addBookRow(group, width, y, depth, count = 5) {
  for (let index = 0; index < count; index += 1) {
    const bookWidth = Math.min(0.14, width / (count * 1.35));
    const height = 0.24 + (index % 3) * 0.06;
    const x = -width * 0.37 + index * width * 0.16;
    addBox(group, bookWidth, height, depth * 0.7, x, y + height / 2, 0, [COLORS.terracotta, COLORS.green, COLORS.brass, COLORS.fabric, COLORS.woodDark][index % 5], { roughness: 0.9 }, 'book');
  }
}

function buildStorage(group, item, shape = 'storage') {
  const { x: width, z: depth } = dimensionsOf(item);
  const height = shape === 'wallShelf' ? 0.18 : heightOf(item, shape === 'cabinet' ? 1.0 : 1.7);
  if (shape === 'wallShelf') {
    addBox(group, width, height, depth, 0, 1.35, 0, COLORS.woodLight, {}, 'wall-shelf');
    addBox(group, width * 0.92, 0.045, depth * 0.9, 0, 1.48, 0, COLORS.brass, { metalness: 0.45 }, 'shelf-lip');
    addBookRow(group, width, 1.5, depth, 4);
    return;
  }
  addBox(group, width, height, depth, 0, height / 2, 0, COLORS.wood, {}, 'storage-body');
  addBox(group, width * 0.88, height * 0.88, depth * 0.035, 0, height * 0.52, -depth * 0.52, COLORS.woodDark, { roughness: 0.82 }, 'storage-back');
  const shelfCount = shape === 'cabinet' ? 1 : 2;
  for (let index = 1; index <= shelfCount; index += 1) {
    const y = (height / (shelfCount + 1)) * index;
    addBox(group, width * 0.9, 0.035, depth * 0.96, 0, y, depth * 0.02, COLORS.woodLight, {}, 'storage-shelf');
    if (shape !== 'cabinet') addBookRow(group, width, y + 0.04, depth, 4);
  }
  if (shape === 'cabinet') {
    addBox(group, width * 0.43, height * 0.82, 0.035, -width * 0.23, height * 0.52, -depth * 0.54, COLORS.woodLight, {}, 'cabinet-door');
    addBox(group, width * 0.43, height * 0.82, 0.035, width * 0.23, height * 0.52, -depth * 0.54, COLORS.woodLight, {}, 'cabinet-door');
    for (const x of [-width * 0.08, width * 0.08]) addCylinder(group, 0.028, 0.06, x, height * 0.52, -depth * 0.59, COLORS.brass, { metalness: 0.7 }, 12, 'cabinet-handle');
  }
  addBox(group, width * 0.05, height * 0.08, depth * 0.08, width * 0.25, height * 0.52, -depth * 0.58, COLORS.brass, { metalness: 0.7 }, 'storage-knob');
}

function buildBed(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addBox(group, width, 0.28, depth, 0, 0.28, 0, COLORS.wood, {}, 'bed-frame');
  addBox(group, width * 0.94, 0.22, depth * 0.82, 0, 0.52, 0.02, COLORS.fabric, { roughness: 0.94 }, 'mattress');
  addBox(group, width * 0.88, 0.09, depth * 0.58, 0, 0.68, depth * 0.12, COLORS.fabricLight, { roughness: 0.96 }, 'duvet');
  addBox(group, width * 0.98, 0.8, 0.12, 0, 0.68, -depth * 0.44, COLORS.woodLight, {}, 'headboard');
  for (const x of [-width * 0.27, width * 0.27]) addBox(group, width * 0.2, 0.12, depth * 0.2, x, 0.72, -depth * 0.28, COLORS.white, { roughness: 0.96 }, 'pillow');
  addLegs(group, width * 0.82, depth * 0.78, 0.18, COLORS.dark, 0.04);
}

function buildPlant(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const radius = Math.max(0.12, Math.min(width, depth) * 0.42);
  addCylinder(group, radius, 0.35, 0, 0.175, 0, COLORS.ceramic, {}, 20, 'plant-pot');
  addCylinder(group, radius * 0.78, 0.025, 0, 0.36, 0, COLORS.woodDark, { roughness: 0.95 }, 18, 'plant-soil');
  addCylinder(group, 0.035, 0.7, 0, 0.7, 0, COLORS.green, {}, 10, 'plant-stem');
  for (const [x, y, z, scale, rotation] of [
    [-0.18, 0.78, 0, 0.22, -0.45], [0.16, 0.88, 0.04, 0.25, 0.4], [-0.04, 1.06, -0.02, 0.23, 0.12], [0.1, 1.24, 0, 0.2, -0.25], [-0.2, 1.06, 0.02, 0.17, 0.5]
  ]) {
    const leaf = addSphere(group, scale, x, y, z, y > 1 ? COLORS.greenLight : COLORS.green, {}, [1.6, 0.35, 0.75], 'plant-leaf');
    leaf.rotation.z = rotation;
  }
}

function buildTelevision(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const panelDepth = Math.max(0.08, depth * 0.72);
  const panelHeight = Math.max(0.72, width * 0.5);
  addBox(group, width, panelHeight, panelDepth, 0, 1.05, 0, COLORS.black, { roughness: 0.38, metalness: 0.35 }, 'tv-frame');
  addBox(group, width * 0.9, panelHeight * 0.78, 0.024, 0, 1.05, -panelDepth * 0.53, COLORS.screen, { roughness: 0.2, metalness: 0.12, emissive: COLORS.screen, emissiveIntensity: 0.26 }, 'tv-screen');
  addBox(group, width * 0.78, 0.025, 0.035, 0, 1.05 + panelHeight * 0.28, -panelDepth * 0.56, COLORS.brass, { metalness: 0.55 }, 'tv-screen-highlight');
  addBox(group, width * 0.2, 0.42, depth * 0.32, 0, 0.42, 0.03, COLORS.metalDark, { metalness: 0.55 }, 'tv-neck');
  addBox(group, width * 0.56, 0.08, depth * 0.72, 0, 0.06, 0.03, COLORS.metalDark, { metalness: 0.55 }, 'tv-stand');
  addCylinder(group, 0.03, 0.05, width * 0.38, panelHeight * 0.2 + 1.05, -panelDepth * 0.58, COLORS.brassLight, { metalness: 0.7 }, 12, 'tv-indicator');
}

function buildMirror(group, item) {
  const { x: width } = dimensionsOf(item);
  const frame = Math.max(0.06, Math.min(width, 0.32) * 0.18);
  addBox(group, width, frame, frame, 0, 1.45, 0, COLORS.wood, {}, 'mirror-frame');
  addBox(group, width, frame, frame, 0, 0.03, 0, COLORS.wood, {}, 'mirror-frame');
  addBox(group, frame, 1.45, frame, -width / 2 + frame / 2, 0.74, 0, COLORS.wood, {}, 'mirror-frame');
  addBox(group, frame, 1.45, frame, width / 2 - frame / 2, 0.74, 0, COLORS.wood, {}, 'mirror-frame');
  addBox(group, width * 0.82, 1.2, 0.025, 0, 0.74, -frame * 0.55, COLORS.glass, { metalness: 0.15, roughness: 0.16, transparent: true, opacity: 0.76 }, 'mirror-glass');
  addBox(group, width * 0.58, 0.018, 0.012, -width * 0.08, 1.06, -frame * 0.62, COLORS.white, { transparent: true, opacity: 0.65, castShadow: false }, 'mirror-glint');
}

function buildRug(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addBox(group, width, 0.035, depth, 0, 0.018, 0, COLORS.rug, { roughness: 0.95 }, 'rug-base');
  addBox(group, width * 0.9, 0.04, depth * 0.9, 0, 0.042, 0, COLORS.rugLight, { roughness: 0.95 }, 'rug-field');
  for (const x of [-width * 0.35, 0, width * 0.35]) addBox(group, width * 0.025, 0.012, depth * 0.78, x, 0.07, 0, COLORS.rug, { roughness: 0.95 }, 'rug-stripe');
  for (const z of [-depth * 0.3, depth * 0.3]) addBox(group, width * 0.78, 0.012, depth * 0.025, 0, 0.07, z, COLORS.rug, { roughness: 0.95 }, 'rug-stripe');
}

function buildVase(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const radius = Math.max(0.1, Math.min(width, depth) * 0.42);
  const points = [
    new THREE.Vector2(radius * 0.55, 0),
    new THREE.Vector2(radius, 0.08),
    new THREE.Vector2(radius * 0.82, 0.25),
    new THREE.Vector2(radius * 0.66, 0.38),
    new THREE.Vector2(radius * 0.42, 0.52)
  ];
  const vase = new THREE.Mesh(new THREE.LatheGeometry(points, 20), material(COLORS.ceramic, { roughness: 0.34 }));
  vase.position.y = 0.02;
  part(vase, group, 'vase-body');
  addTorus(group, radius * 0.42, 0.025, 0, 0.54, 0, COLORS.brass, [0, 0, 0], { metalness: 0.55 }, 'vase-rim');
  for (const x of [-0.12, 0, 0.12]) addSphere(group, 0.05, x, 0.72 + Math.abs(x) * 0.2, 0, COLORS.green, {}, [0.55, 1.6, 0.55], 'vase-stem');
}

function buildClock(group, item) {
  const { x: width } = dimensionsOf(item);
  const radius = Math.max(0.14, width * 0.38);
  addCylinder(group, radius, 0.08, 0, 0.08, 0, COLORS.woodDark, { metalness: 0.2 }, 28, 'clock-frame');
  addCylinder(group, radius * 0.82, 0.022, 0, 0.125, 0, COLORS.ceramic, { roughness: 0.35 }, 28, 'clock-face');
  addBox(group, 0.018, radius * 0.62, 0.025, 0, 0.2, -0.04, COLORS.dark, { castShadow: false }, 'clock-hand');
  const hand = addBox(group, 0.018, radius * 0.42, 0.025, radius * 0.12, 0.17, -0.05, COLORS.dark, { castShadow: false }, 'clock-hand');
  hand.rotation.z = -0.9;
  addTorus(group, radius * 0.88, 0.018, 0, 0.13, 0, COLORS.brass, [0, 0, 0], { metalness: 0.6 }, 'clock-ring');
}

function buildDecor(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  addCylinder(group, Math.max(0.1, Math.min(width, depth) * 0.35), 0.12, 0, 0.06, 0, COLORS.ceramic, { roughness: 0.55 }, 18, 'decor-base');
  addSphere(group, Math.max(0.12, Math.min(width, depth) * 0.28), 0, 0.25, 0, COLORS.brassLight, { metalness: 0.2 }, [1, 0.7, 1], 'decor-center');
  addTorus(group, Math.max(0.12, Math.min(width, depth) * 0.3), 0.018, 0, 0.25, 0, COLORS.woodDark, [Math.PI / 2, 0, 0], { roughness: 0.8 }, 'decor-accent');
  addSphere(group, 0.06, -0.13, 0.5, 0, COLORS.green, {}, [0.7, 1.3, 0.7], 'decor-detail');
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
    if (primaryApplied || object.userData.kind !== 'item-part' || !object.material?.color) return;
    object.material.color.setHex(color);
    object.userData.baseColor = color;
    primaryApplied = true;
  });
}

function buildShape(group, item, profile) {
  switch (profile.shape) {
    case 'sofa': return buildSofa(group, item);
    case 'sectionalSofa': return buildSectionalSofa(group, item);
    case 'straightSofa': return buildStraightSofa(group, item);
    case 'chair': return buildChair(group, item);
    case 'diningChair': return buildDiningChair(group, item);
    case 'loungeArmchair': return buildLoungeArmchair(group, item);
    case 'officeChair': return buildOfficeChair(group, item);
    case 'ottoman': return buildOttoman(group, item);
    case 'entryBench': return buildEntryBench(group, item);
    case 'barStool': return buildBarStool(group, item);
    case 'classicArmchair': return buildClassicArmchair(group, item);
    case 'table':
    case 'diningTable': return buildDiningTable(group, item);
    case 'roundTable': return buildRoundTable(group, item);
    case 'lowTable': return buildLowTable(group, item);
    case 'desk': return buildDesk(group, item);
    case 'computerDesk': return buildComputerDesk(group, item);
    case 'tableLamp':
    case 'floorLamp':
    case 'ceilingLamp': return buildLamp(group, item, profile.shape);
    case 'wallShelf':
    case 'bookcase':
    case 'cabinet':
    case 'storage': return buildStorage(group, item);
    case 'sideboard': return buildSideboard(group, item);
    case 'mediaConsole': return buildMediaConsole(group, item);
    case 'nightstand': return buildNightstand(group, item);
    case 'bed': return buildBed(group, item);
    case 'plant': return buildPlant(group, item);
    case 'television': return buildTelevision(group, item);
    case 'mirror': return buildMirror(group, item);
    case 'rug': return buildRug(group, item);
    case 'vase': return buildVase(group, item);
    case 'clock': return buildClock(group, item);
    case 'decor':
    default: return buildDecor(group, item);
  }
}

function addThinItemHitProxy(group, item, profile) {
  if (!['mirror', 'wallShelf', 'bookcase'].includes(profile.shape)) return;
  const { x: width, z: depth } = dimensionsOf(item);
  const proxySize = profile.shape === 'mirror'
    ? [Math.max(width, 0.5), 1.55, 0.16]
    : [Math.max(width, 0.5), 0.5, Math.max(depth, 0.3)];
  const proxy = new THREE.Mesh(
    new THREE.BoxGeometry(...proxySize),
    new THREE.MeshStandardMaterial({ transparent: true, opacity: 0, depthWrite: false, color: 0xffffff })
  );
  proxy.position.y = profile.shape === 'mirror' ? 0.76 : 1.35;
  proxy.name = 'item-hit-proxy';
  proxy.userData.kind = 'item-hit-proxy';
  group.add(proxy);
}

function addSelectionHalo(group, item) {
  const { x: width, z: depth } = dimensionsOf(item);
  const radius = Math.max(0.28, Math.max(width, depth) * 0.56);
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.82, radius, 32),
    new THREE.MeshBasicMaterial({ color: FEEDBACK.selected.color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  halo.name = 'selection-halo';
  halo.userData.kind = 'item-feedback';
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.025;
  halo.visible = false;
  halo.renderOrder = 4;
  halo.raycast = () => {};
  group.add(halo);
}

function updateFeedback(group, state, { ghost = false } = {}) {
  const safeState = state === 'warning' ? 'warning' : state === 'invalid' ? 'invalid' : state === 'valid' ? 'valid' : state === 'selected' ? 'selected' : 'idle';
  const accent = FEEDBACK[safeState];
  group.userData.feedbackState = safeState;
  group.userData.feedbackAccent = safeState === 'invalid' ? 'error' : safeState === 'warning' ? 'warning' : safeState === 'valid' ? 'success' : safeState === 'selected' ? 'selection' : 'none';
  const halo = group.getObjectByName('selection-halo');
  if (halo) {
    halo.visible = safeState !== 'idle';
    halo.material.color.setHex(accent?.color ?? FEEDBACK.selected.color);
    halo.material.opacity = ghost ? Math.max(0.52, accent?.opacity ?? 0.7) : (accent?.opacity ?? 0.7);
    halo.scale.setScalar(safeState === 'invalid' ? 1.04 : 1);
  }
  group.traverse(object => {
    if (!object.isMesh || !['item-part', 'item-asset-part'].includes(object.userData.kind) || !object.material) return;
    const baseColor = object.userData.baseColor ?? object.material.color.getHex();
    if (ghost) {
      object.material.transparent = true;
      object.material.opacity = 0.46;
      object.material.depthWrite = false;
      object.material.color.setHex(accent?.color ?? FEEDBACK.valid.color);
      object.material.emissive.setHex(accent?.color ?? FEEDBACK.valid.color);
      object.material.emissiveIntensity = safeState === 'invalid' ? 0.36 : 0.2;
    } else {
      object.material.transparent = false;
      object.material.opacity = 1;
      object.material.depthWrite = true;
      object.material.color.setHex(baseColor);
      object.material.emissive.setHex(safeState === 'selected' ? 0x2f6fc5 : 0x000000);
      object.material.emissiveIntensity = safeState === 'selected' ? 0.48 : 0;
    }
  });
}

export class ItemVisualFactory {
  static create(item, { ghost = false, configuration = null } = {}) {
    const group = new THREE.Group();
    const profile = profileFor(item);
    group.userData.itemId = item.id;
    group.userData.catalogItemId = item.id;
    group.userData.visualShape = profile.shape;
    group.userData.visualFamily = profile.visualFamily ?? profile.shape;
    group.userData.detailLevel = VISUAL_DETAIL_CONTRACT.detailLevel;
    group.userData.feedbackState = 'idle';
    buildShape(group, item, profile);
    addThinItemHitProxy(group, item, profile);
    addSelectionHalo(group, item);
    applyProfile(group, profile);

    if (profile.light) {
      const light = new THREE.PointLight(
        new THREE.Color(profile.light.color ?? '#ffd38c'),
        profile.light.intensity ?? 1,
        profile.light.range ?? 3
      );
      light.position.y = 1;
      light.castShadow = false;
      light.userData.kind = 'item-light';
      group.add(light);
    }

    group.traverse(object => {
      if (!object.isMesh) return;
      object.userData.itemId = item.id;
      object.userData.catalogItemId = item.id;
      if (!object.userData.kind) object.userData.kind = 'item-part';
      if (object.userData.kind === 'item-part' && object.material?.color) object.userData.baseColor = object.material.color.getHex();
    });
    group.userData.detailCount = group.children.filter(child => child.userData.kind === 'item-part').length;
    ItemVisualFactory.applyConfiguration(group, item, configuration);

    if (ghost) ItemVisualFactory.setGhost(group, true);
    return group;
  }

  static applyConfiguration(group, item, configuration = null) {
    if (!group || !item) return;
    if (typeof item.resolveConfiguration !== 'function') {
      group.userData.variantId = null;
      group.userData.variantVisual = null;
      group.userData.variantScale = 1;
      return;
    }
    const resolved = item.resolveConfiguration(configuration);
    group.userData.variantId = resolved.variantId;
    group.userData.variantVisual = resolved.visual;
    group.userData.variantScale = resolved.visual?.scale ?? 1;
    if (!resolved.visual?.color) return;
    const color = new THREE.Color(resolved.visual.color).getHex();
    group.traverse(object => {
      if (!object.isMesh || !['item-part', 'item-asset-part'].includes(object.userData.kind) || !object.material?.color) return;
      object.material.color.setHex(color);
      object.userData.baseColor = color;
    });
  }

  static attachAsset(group, asset) {
    if (!group || !asset) return;
    group.children
      .filter(child => child.userData.kind === 'item-part')
      .forEach(child => { child.visible = false; child.userData.fallbackHidden = true; });
    asset.traverse(object => {
      if (!object.isMesh) return;
      object.userData.kind = 'item-asset-part';
      object.userData.itemId = group.userData.itemId;
      object.userData.catalogItemId = group.userData.catalogItemId;
      if (object.material?.color) object.userData.baseColor = object.material.color.getHex();
    });
    group.add(asset);
    group.userData.assetId = asset.userData.assetId ?? null;
    group.userData.assetState = 'ready';
    const visual = group.userData.variantVisual;
    if (visual?.color) {
      const color = new THREE.Color(visual.color).getHex();
      asset.traverse(object => {
        if (object.isMesh && object.material?.color) { object.material.color.setHex(color); object.userData.baseColor = color; }
      });
    }
    const state = group.userData.feedbackState ?? 'idle';
    updateFeedback(group, state, { ghost: state === 'valid' || state === 'invalid' || state === 'warning' });
  }

  static setSelected(group, selected) {
    if (!group) return;
    if (selected) updateFeedback(group, 'selected');
    else if (!group.userData.feedbackState || group.userData.feedbackState === 'selected') updateFeedback(group, 'idle');
  }

  static setGhost(group, ghost, valid = true) {
    if (!group) return;
    if (ghost) updateFeedback(group, valid ? 'valid' : 'invalid', { ghost: true });
    else updateFeedback(group, 'idle');
  }

  static setGhostValidity(group, valid) {
    if (!group) return;
    updateFeedback(group, valid ? 'valid' : 'invalid', { ghost: true });
  }

  static setPreviewValidity(group, valid) {
    if (!group) return;
    if (valid) {
      if (group.userData.feedbackState === 'invalid' || group.userData.feedbackState === 'valid') updateFeedback(group, 'idle');
    } else updateFeedback(group, 'invalid');
  }
}

export default ItemVisualFactory;
