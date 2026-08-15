import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import LocationEnvironmentSystem from '../../src/Presentation/Scene/LocationEnvironmentSystem.js';
import ItemVisualFactory from '../../src/Presentation/Scene/ItemVisualFactory.js';

describe('UI-ROOM-004 fixture interaction', () => {
  it('exposes ambient mirror and bookshelf as movable presentation fixtures', () => {
    const scene = new THREE.Scene();
    const environmentPlan = {
      exterior: { sidewalkColor: 0x967e70, roadColor: 0x28333c, facadeColor: 0x76675e, foliageColor: 0x587865, routeScale: 1 },
      fixtures: ['mirror', 'bookshelf'],
      lighting: { background: 0x172131, fog: 0x172131, hemisphereSky: 0xbad7ff, hemisphereGround: 0x202938, hemisphereIntensity: 1.9, key: 0xffe8c7, keyIntensity: 3.2, rim: 0x5799f4, rimIntensity: 15, warm: 0xffb46d, warmIntensity: 7 },
      sceneLife: { moteCount: 14, petEnabled: false, routeScale: 1 }
    };
    const environment = new LocationEnvironmentSystem(scene, { width: 8, depth: 6, environmentPlan });
    const fixtures = environment.getInteractableObjects();

    expect(fixtures.map(fixture => fixture.userData.fixtureId)).toEqual([
      'ambient-mirror', 'ambient-bookshelf'
    ]);
    expect(environment.moveFixture('ambient-bookshelf', 5)).toBe(true);
    expect(environment.moveFixture('ambient-mirror', 7)).toBe(true);
    expect(environment.moveFixture('unknown', 4)).toBe(false);

    environment.destroy();
  });

  it('adds hit areas to thin catalog mirror and shelf visuals', () => {
    const mirror = ItemVisualFactory.create({ id: 'mirror-001', type: 'decor', dimensions: { x: 0.8, z: 0.05 } });
    const shelf = ItemVisualFactory.create({ id: 'shelf-001', type: 'storage', dimensions: { x: 1.1, z: 0.25 } });

    const mirrorProxy = mirror.children.find(child => child.userData.kind === 'item-hit-proxy');
    const shelfProxy = shelf.children.find(child => child.userData.kind === 'item-hit-proxy');
    expect(mirrorProxy?.userData.itemId).toBe('mirror-001');
    expect(shelfProxy?.userData.itemId).toBe('shelf-001');
  });
});
