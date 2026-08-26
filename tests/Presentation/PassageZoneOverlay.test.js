import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createPassageZoneOverlay, zoneColorFor } from '../../src/Presentation/Scene/PassageZoneOverlay.js';

const doorZone = { id: 'opening-door', label: 'Проход у двери', x: 0, z: 3.1, width: 0.9, depth: 1 };
const windowZone = { id: 'opening-window', label: 'Зона перед окном', x: 3, z: 5.55, width: 2, depth: 0.45 };
const authoredZone = { id: 'entry', label: 'Вход', x: 0, z: 2, width: 1.2, depth: 2 };

describe('createPassageZoneOverlay', () => {
  it('builds one translucent fill plus one outline per zone at the rectangle center', () => {
    const group = createPassageZoneOverlay([doorZone, windowZone]);

    expect(group.name).toBe('passage-zone-overlay');
    expect(group.children).toHaveLength(4);

    const fill = group.children[0];
    expect(fill).toBeInstanceOf(THREE.Mesh);
    expect(fill.rotation.x).toBeCloseTo(-Math.PI / 2);
    expect(fill.position.x).toBeCloseTo(doorZone.x + doorZone.width / 2, 6);
    expect(fill.position.z).toBeCloseTo(doorZone.z + doorZone.depth / 2, 6);

    const outline = group.children[1];
    expect(outline).toBeInstanceOf(THREE.LineSegments);
    expect(outline.position.y).toBeGreaterThan(fill.position.y);
    expect(fill.userData.zoneId).toBe('opening-door');
    expect(outline.userData.zoneId).toBe('opening-door');
  });

  it('colors opening zones distinctly from authored gameplay zones', () => {
    const doorColor = zoneColorFor(doorZone);
    const windowColor = zoneColorFor(windowZone);
    const authoredColor = zoneColorFor(authoredZone);

    expect(new THREE.Color(doorColor).getHex()).not.toBe(new THREE.Color(windowColor).getHex());
    expect(new THREE.Color(doorColor).getHex()).not.toBe(new THREE.Color(authoredColor).getHex());

    const group = createPassageZoneOverlay([doorZone]);
    const material = group.children[0].material;
    expect(material.transparent).toBe(true);
    expect(material.opacity).toBeLessThan(0.3);
    expect(material.color.getHex()).toBe(new THREE.Color(doorColor).getHex());
  });

  it('produces an empty overlay and tolerates malformed entries', () => {
    expect(createPassageZoneOverlay([]).children).toHaveLength(0);
    expect(createPassageZoneOverlay().children).toHaveLength(0);
    expect(createPassageZoneOverlay([null, {}, doorZone]).children).toHaveLength(2);
  });
});
