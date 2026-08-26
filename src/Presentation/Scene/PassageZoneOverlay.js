import * as THREE from 'three';

/**
 * Visual guide layer for ergonomics passage zones.
 * Zones are the same immutable Domain rectangles the evaluator enforces,
 * so what the player sees as protected floor matches the rules exactly.
 */
const ZONE_COLORS = Object.freeze({
  door: 0xd9964a,
  window: 0x7aa5c8,
  default: 0x6f8f87
});

export function zoneColorFor(zone) {
  if (zone?.id === 'opening-door' || zone?.kind === 'door') return ZONE_COLORS.door;
  if (zone?.id === 'opening-window' || zone?.kind === 'window') return ZONE_COLORS.window;
  return ZONE_COLORS.default;
}

function normalizeZone(zone) {
  return {
    id: String(zone.id ?? 'zone'),
    label: zone.label ?? '',
    x: Number(zone.x ?? 0),
    z: Number(zone.z ?? 0),
    width: Number(zone.width ?? 1),
    depth: Number(zone.depth ?? 1)
  };
}

function addFill(group, zone, color) {
  const geometry = new THREE.PlaneGeometry(zone.width, zone.depth);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });
  const fill = new THREE.Mesh(geometry, material);
  fill.rotation.x = -Math.PI / 2;
  fill.position.set(zone.x + zone.width / 2, 0.015, zone.z + zone.depth / 2);
  fill.userData.zoneId = zone.id;
  group.add(fill);
}

function addOutline(group, zone, color) {
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(zone.width, zone.depth)),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55 })
  );
  outline.rotation.x = -Math.PI / 2;
  outline.position.set(zone.x + zone.width / 2, 0.02, zone.z + zone.depth / 2);
  outline.userData.zoneId = zone.id;
  group.add(outline);
}

/** Builds a detached THREE.Group with one translucent fill + outline per zone. */
export function createPassageZoneOverlay(zones = []) {
  const group = new THREE.Group();
  group.name = 'passage-zone-overlay';
  for (const raw of Array.isArray(zones) ? zones : []) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || raw.id.trim() === '') continue;
    const zone = normalizeZone(raw);
    const color = zoneColorFor(zone);
    addFill(group, zone, color);
    addOutline(group, zone, color);
  }
  return group;
}
