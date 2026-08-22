import { describe, expect, it } from 'vitest';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import PassageZone from '../../../src/Domain/Ergonomics/PassageZone.js';
import PassageZoneEvaluator from '../../../src/Domain/Ergonomics/PassageZoneEvaluator.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';

const featureVector = new FeatureVector({
  woodShare: 0.7, metalShare: 0.1, glassShare: 0.05, plasticShare: 0.05, textileShare: 0.1,
  lightColorShare: 0.7, darkColorShare: 0.3, warmPaletteShare: 0.6, saturationLevel: 0.3,
  formSimplicity: 0.8, roundnessShare: 0.2, rectilinearShare: 0.8, sizeNorm: 0.5,
  priceNorm: 0.5, lightingFunctionShare: 0, storageFunctionShare: 0
});

function createItem(id, dimensions = { x: 1, z: 1 }, spatialBehavior = new SpatialBehavior({
  schemaVersion: 1, placementKind: 'floor', occupancyMode: 'occupies', clearanceMode: 'obstacle', supportMode: 'none'
})) {
  return new Item({
    id, name: id, type: 'seating', dimensions, featureVector,
    interactionProfile: new InteractionProfile({ schemaVersion: 1, affordances: ['lounge-seat'] }),
    spatialBehavior
  });
}

function roomWith(...placements) {
  const room = RoomState.createEmpty(new RoomBounds(8, 6));
  for (const [item, position, rotation = 0] of placements) {
    expect(room.placeItem(item, position, rotation).success).toBe(true);
  }
  return room;
}

describe('PassageZoneEvaluator', () => {
  const entrance = new PassageZone({
    id: 'entrance-passage',
    label: 'Входной проход',
    x: 0,
    z: 2,
    width: 1.2,
    depth: 2,
    weight: 1.4
  });

  it('reports no issue when items do not occupy an authored passage zone', () => {
    const room = roomWith([createItem('chair-001'), { x: 3, z: 3 }]);

    expect(new PassageZoneEvaluator().evaluate(room, [entrance])).toEqual([]);
  });

  it('reports an explainable ergonomics violation when an item overlaps a passage zone', () => {
    const room = roomWith([createItem('chair-001'), { x: 0.5, z: 2.5 }]);

    const [violation] = new PassageZoneEvaluator().evaluate(room, [entrance]);

    expect(violation.constraintId).toBe('ergonomics-passage-zone-free');
    expect(violation.messageKey).toBe('ergonomics-passage-zone-free');
    expect(violation.itemIds).toEqual(['chair-001#1']);
    expect(violation.zoneId).toBe('entrance-passage');
    expect(violation.zoneLabel).toBe('Входной проход');
    expect(violation.severity).toBeGreaterThan(0);
    expect(violation.constraint.weight).toBe(1.4);
  });

  it('uses item rotation when detecting zone overlap', () => {
    const room = roomWith([createItem('bench-001', { x: 2, z: 0.4 }), { x: 1.1, z: 3 }, 90]);

    expect(new PassageZoneEvaluator().evaluate(room, [entrance])).toHaveLength(1);
  });

  it('ignores non-floor artifacts even when their visual footprint overlaps a passage zone', () => {
    const overlay = new SpatialBehavior({
      schemaVersion: 1, placementKind: 'floor-overlay', occupancyMode: 'ignored', clearanceMode: 'ignored', supportMode: 'none'
    });
    const room = roomWith([createItem('rug-001', { x: 1.2, z: 2 }, overlay), { x: 0.6, z: 2.5 }]);

    expect(new PassageZoneEvaluator().evaluate(room, [entrance])).toEqual([]);
  });
});
