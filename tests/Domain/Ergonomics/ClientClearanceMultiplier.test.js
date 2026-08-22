import { describe, expect, it } from 'vitest';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import MinimumClearanceRule from '../../../src/Domain/Ergonomics/MinimumClearanceRule.js';
import ClearanceEvaluator from '../../../src/Domain/Ergonomics/ClearanceEvaluator.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';
import SpatialBehavior from '../../../src/Domain/Items/SpatialBehavior.js';

function createItem(id) {
  return new Item({
    id,
    name: id,
    type: 'surface',
    dimensions: { x: 1, z: 1 },
    featureVector: new FeatureVector({
      woodShare: 0.5,
      metalShare: 0.1,
      glassShare: 0.1,
      plasticShare: 0.1,
      textileShare: 0.2,
      lightColorShare: 0.5,
      darkColorShare: 0.5,
      warmPaletteShare: 0.5,
      saturationLevel: 0.3,
      formSimplicity: 0.8,
      roundnessShare: 0.2,
      rectilinearShare: 0.8,
      sizeNorm: 0.5,
      priceNorm: 0.5,
      lightingFunctionShare: 0,
      storageFunctionShare: 0
    }),
    interactionProfile: new InteractionProfile({ schemaVersion: 1, affordances: ['coffee-surface'] }),
    spatialBehavior: new SpatialBehavior({
      schemaVersion: 1, placementKind: 'floor', occupancyMode: 'occupies', clearanceMode: 'obstacle', supportMode: 'none'
    })
  });
}

describe('Client-specific clearance multiplier', () => {
  it('derives an effective minimum distance without mutating the authored rule', () => {
    const rule = new MinimumClearanceRule({ minimumDistance: 0.8, weight: 1, clientMultiplier: 0.75 });

    expect(rule.minimumDistance).toBe(0.8);
    expect(rule.clientMultiplier).toBe(0.75);
    expect(rule.effectiveMinimumDistance).toBeCloseTo(0.6, 5);
  });

  it('keeps the neutral multiplier backward-compatible', () => {
    const rule = new MinimumClearanceRule({ minimumDistance: 0.8, weight: 1 });

    expect(rule.clientMultiplier).toBe(1);
    expect(rule.effectiveMinimumDistance).toBe(0.8);
  });

  it('does not penalize a 0.7 m edge gap when the intimate client brief scales 0.8 m to 0.6 m', () => {
    const room = RoomState.createEmpty(new RoomBounds(6, 5));
    const sofa = createItem('sofa-002');
    const coffeeTable = createItem('table-002');
    expect(room.placeItem(sofa, { x: 2, z: 2.5 }).success).toBe(true);
    expect(room.placeItem(coffeeTable, { x: 4.2, z: 2.5 }).success).toBe(true);

    const rule = new MinimumClearanceRule({ minimumDistance: 0.8, weight: 1, clientMultiplier: 0.75 });
    const violations = new ClearanceEvaluator().evaluate(room, rule);

    expect(violations).toEqual([]);
  });

  it('reports the effective client threshold and severity when the gap is below it', () => {
    const room = RoomState.createEmpty(new RoomBounds(6, 5));
    expect(room.placeItem(createItem('left'), { x: 1, z: 2 }).success).toBe(true);
    expect(room.placeItem(createItem('right'), { x: 2.1, z: 2 }).success).toBe(true);

    const rule = new MinimumClearanceRule({ minimumDistance: 0.8, weight: 1, clientMultiplier: 0.75 });
    const [violation] = new ClearanceEvaluator().evaluate(room, rule);

    expect(violation.threshold).toBeCloseTo(0.6, 5);
    expect(violation.actualValue).toBeCloseTo(0.1, 5);
    expect(violation.severity).toBeCloseTo((0.6 - 0.1) / 0.6, 5);
  });
});
