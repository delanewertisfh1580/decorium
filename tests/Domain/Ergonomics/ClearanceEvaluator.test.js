import { describe, expect, it } from 'vitest';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import MinimumClearanceRule from '../../../src/Domain/Ergonomics/MinimumClearanceRule.js';
import ClearanceEvaluator from '../../../src/Domain/Ergonomics/ClearanceEvaluator.js';

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
    expect(violation.itemIds).toEqual(['chair-a', 'chair-b']);
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

  it('uses rotated dimensions when computing the footprint gap', () => {
    const wideItem = new Item({
      id: 'wide',
      name: 'wide',
      type: 'surface',
      dimensions: { x: 2, z: 0.5 },
      featureVector: createItem('feature-source').featureVector
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
      excludedPairs: [['dining-table', 'dining-chair']]
    });

    expect(violations.map(violation => violation.itemIds)).toEqual([
      ['cabinet', 'dining-chair']
    ]);
  });
});
