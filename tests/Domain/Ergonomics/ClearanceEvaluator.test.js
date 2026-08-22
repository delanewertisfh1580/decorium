import { describe, expect, it } from 'vitest';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import MinimumClearanceRule from '../../../src/Domain/Ergonomics/MinimumClearanceRule.js';
import ClearanceEvaluator from '../../../src/Domain/Ergonomics/ClearanceEvaluator.js';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';

function createItem(id) {
  return new Item({
    id,
    name: id,
    type: 'seating',
    dimensions: { x: 1, z: 1 },
      featureVector: new FeatureVector({
        woodShare: 0.7,
      metalShare: 0.1,
      glassShare: 0.05,
      plasticShare: 0.05,
      textileShare: 0.1,
      lightColorShare: 0.7,
      darkColorShare: 0.3,
      warmPaletteShare: 0.6,
      saturationLevel: 0.3,
      formSimplicity: 0.8,
      roundnessShare: 0.2,
      rectilinearShare: 0.8,
      sizeNorm: 0.5,
      priceNorm: 0.5,
      lightingFunctionShare: 0,
      storageFunctionShare: 0
    }),
    interactionProfile: new InteractionProfile({ schemaVersion: 1, affordances: ['lounge-seat'] }),
    spatialBehavior: new SpatialBehavior({
      schemaVersion: 1, placementKind: 'floor', occupancyMode: 'occupies', clearanceMode: 'obstacle', supportMode: 'none'
    })
  });
}

function createRoom(placements) {
  const room = RoomState.createEmpty(new RoomBounds(8, 6));
  for (const [item, position, rotation = 0] of placements) {
    expect(room.placeItem(item, position, rotation).success).toBe(true);
  }
  return room;
}

describe('ClearanceEvaluator', () => {
  const rule = new MinimumClearanceRule({ minimumDistance: 0.9, weight: 1.5 });

  it('returns no violation when occupied footprints have enough free passage', () => {
    const room = createRoom([
      [createItem('chair-a'), { x: 1, z: 1 }],
      [createItem('chair-b'), { x: 3, z: 1 }]
    ]);

    expect(new ClearanceEvaluator().evaluate(room, rule)).toEqual([]);
  });

  it('reports a normalized violation for insufficient edge-to-edge clearance', () => {
    const room = createRoom([
      [createItem('chair-a'), { x: 1, z: 1 }],
      [createItem('chair-b'), { x: 2.3, z: 1 }]
    ]);

    const [violation] = new ClearanceEvaluator().evaluate(room, rule);

    expect(violation.constraintId).toBe('ergonomics-minimum-clearance');
    expect(violation.messageKey).toBe('ergonomics-minimum-clearance');
    expect(violation.itemIds).toEqual(['chair-a#1', 'chair-b#1']);
    expect(violation.actualValue).toBeCloseTo(0.3, 5);
    expect(violation.threshold).toBe(0.9);
    expect(violation.severity).toBeCloseTo(2 / 3, 5);
    expect(violation.constraint.weight).toBe(1.5);
  });

  it('treats overlapping footprints as zero-clearance violations without blocking creative placement', () => {
    const room = createRoom([
      [createItem('chair-a'), { x: 1, z: 1 }],
      [createItem('chair-b'), { x: 1.4, z: 1 }]
    ]);

    const [violation] = new ClearanceEvaluator().evaluate(room, rule);

    expect(violation.actualValue).toBe(0);
    expect(violation.severity).toBe(1);
  });

  it('ignores an authored floor overlay rather than applying universal clearance to its footprint', () => {
    const rug = new Item({
      id: 'rug-001',
      name: 'rug',
      type: 'decor',
      dimensions: { x: 2, z: 2 },
      featureVector: createItem('feature-source').featureVector,
      interactionProfile: new InteractionProfile({ schemaVersion: 1, affordances: ['floor-decor'] }),
      spatialBehavior: new SpatialBehavior({
        schemaVersion: 1,
        placementKind: 'floor-overlay',
        occupancyMode: 'ignored',
        clearanceMode: 'ignored',
        supportMode: 'none'
      })
    });
    const room = createRoom([
      [createItem('chair-a'), { x: 1, z: 1 }],
      [rug, { x: 1, z: 1 }]
    ]);

    expect(new ClearanceEvaluator().evaluate(room, rule)).toEqual([]);
  });

  it('uses rotated dimensions when computing the footprint gap', () => {
    const wideItem = new Item({
      id: 'wide',
      name: 'wide',
      type: 'surface',
      dimensions: { x: 2, z: 0.5 },
      featureVector: createItem('feature-source').featureVector,
      interactionProfile: new InteractionProfile({ schemaVersion: 1, affordances: ['work-surface'] }),
      spatialBehavior: new SpatialBehavior({
        schemaVersion: 1, placementKind: 'floor', occupancyMode: 'occupies', clearanceMode: 'obstacle', supportMode: 'none'
      })
    });
    const room = createRoom([
      [wideItem, { x: 2, z: 2 }, 90],
      [createItem('chair-b'), { x: 2, z: 4.5 }]
    ]);

    expect(new ClearanceEvaluator().evaluate(room, rule)).toEqual([]);
  });

  it('excludes only confirmed functional pairs from universal clearance penalties', () => {
    const room = createRoom([
      [createItem('dining-table'), { x: 1, z: 1 }],
      [createItem('dining-chair'), { x: 2.3, z: 1 }],
      [createItem('cabinet'), { x: 3.6, z: 1 }]
    ]);

    const violations = new ClearanceEvaluator().evaluate(room, rule, {
      excludedPairs: [['dining-table#1', 'dining-chair#1']]
    });

    expect(violations.map(violation => violation.itemIds)).toEqual([
      ['cabinet#1', 'dining-chair#1']
    ]);
  });

  it('assigns distinct diagnostic IDs to distinct pairs under one clearance rule', () => {
    const room = createRoom([
      [createItem('chair-a'), { x: 1, z: 1 }],
      [createItem('chair-b'), { x: 2.3, z: 1 }],
      [createItem('chair-c'), { x: 5, z: 1 }],
      [createItem('chair-d'), { x: 6.3, z: 1 }]
    ]);

    const violations = new ClearanceEvaluator().evaluate(room, rule);

    expect(violations).toHaveLength(2);
    expect(violations.map(violation => violation.constraintId)).toEqual([
      'ergonomics-minimum-clearance',
      'ergonomics-minimum-clearance'
    ]);
    expect(violations.map(violation => violation.diagnosticId)).toEqual([
      'ergonomics-minimum-clearance:chair-a#1:chair-b#1',
      'ergonomics-minimum-clearance:chair-c#1:chair-d#1'
    ]);
  });
});
