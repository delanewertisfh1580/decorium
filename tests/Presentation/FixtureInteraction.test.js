import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import LocationEnvironmentSystem from '../../src/Presentation/Scene/LocationEnvironmentSystem.js';
import ItemVisualFactory from '../../src/Presentation/Scene/ItemVisualFactory.js';

const environmentPlan = {
  exterior: { sidewalkColor: 0x967e70, roadColor: 0x28333c, facadeColor: 0x76675e, foliageColor: 0x587865, routeScale: 1 },
  exteriorComposition: { kind: 'residential-porch', facadeInsetColor: 0x8d7668, accentColor: 0xc49c6d, foliageScale: 1.05 },
  sceneLife: { moteCount: 14, petEnabled: false, routeScale: 1 }
};

describe('player-owned interior scene ownership', () => {
  it('exposes no fixture interaction and creates no interior preset objects', () => {
    const scene = new THREE.Scene();
    const environment = new LocationEnvironmentSystem(scene, { width: 8, depth: 6, environmentPlan });
    const kinds = [];
    environment.root.traverse(object => { if (object.userData.kind) kinds.push(object.userData.kind); });

    expect(environment.getInteractableObjects()).toEqual([]);
    expect(environment.moveFixture('any-id', 5)).toBe(false);
    expect(kinds).not.toContain('interior-resting-cat');
    expect(kinds.every(kind => !kind.startsWith('interior-'))).toBe(true);
    environment.destroy();
  });

  it('keeps hit areas on thin catalog-owned mirror and shelf visuals', () => {
    const mirror = ItemVisualFactory.create({ id: 'mirror-001', type: 'decor', dimensions: { x: 0.8, z: 0.05 } });
    const shelf = ItemVisualFactory.create({ id: 'shelf-001', type: 'storage', dimensions: { x: 1.1, z: 0.25 } });
    expect(mirror.children.find(child => child.userData.kind === 'item-hit-proxy')?.userData.itemId).toBe('mirror-001');
    expect(shelf.children.find(child => child.userData.kind === 'item-hit-proxy')?.userData.itemId).toBe('shelf-001');
  });
});
