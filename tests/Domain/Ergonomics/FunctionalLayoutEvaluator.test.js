import { describe, expect, it } from 'vitest';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';
import { Item } from '../../../src/Domain/Items/Item.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import FunctionalLayoutRule from '../../../src/Domain/Ergonomics/FunctionalLayoutRule.js';
import FunctionalLayoutEvaluator from '../../../src/Domain/Ergonomics/FunctionalLayoutEvaluator.js';

const vector = new FeatureVector({
  woodShare: 0.7, metalShare: 0.1, glassShare: 0.05, plasticShare: 0.05,
  textileShare: 0.1, lightColorShare: 0.7, darkColorShare: 0.3,
  warmPaletteShare: 0.6, saturationLevel: 0.3, formSimplicity: 0.8,
  roundnessShare: 0.2, rectilinearShare: 0.8, sizeNorm: 0.5, priceNorm: 0.5,
  lightingFunctionShare: 0, storageFunctionShare: 0
});

function item(id, affordance, { dimensions, frontAxis = null, usableSides = [] } = {}) {
  return new Item({
    id,
    name: id,
    type: 'surface',
    dimensions: dimensions ?? { x: 0.5, z: 0.5 },
    featureVector: vector,
    interactionProfile: new InteractionProfile({
      schemaVersion: 1,
      affordances: [affordance],
      frontAxis,
      usableSides
    })
  });
}

function room(placements) {
  const state = RoomState.createEmpty(new RoomBounds(10, 10));
  for (const [placedItem, position, rotation = 0] of placements) {
    expect(state.placeItem(placedItem, position, rotation).success).toBe(true);
  }
  return state;
}

const diningRule = new FunctionalLayoutRule({
  schemaVersion: 1,
  id: 'dining-seating-required',
  kind: 'adjacency',
  anchorSelector: { affordance: 'dining-surface' },
  partnerSelector: { affordance: 'dining-seat' },
  minPartners: 1,
  distance: { min: 0.05, max: 0.35 },
  weight: 1.2,
  messageKey: 'functional-dining-seat-required'
});

describe('FunctionalLayoutEvaluator', () => {
  it('matches a dining seat at an authored usable table side and emits no violation', () => {
    const diningTable = item('dining-table', 'dining-surface', {
      dimensions: { x: 2, z: 1 }, usableSides: ['positiveX']
    });
    const diningChair = item('dining-chair', 'dining-seat');

    const result = new FunctionalLayoutEvaluator().evaluate(room([
      [diningTable, { x: 4, z: 4 }],
      [diningChair, { x: 5.5, z: 4 }]
    ]), [diningRule]);

    expect(result.violations).toEqual([]);
    expect(result.matchedPairs).toEqual([['dining-chair', 'dining-table']]);
  });

  it('does not count a seat on a non-usable table side as dining seating', () => {
    const diningTable = item('dining-table', 'dining-surface', {
      dimensions: { x: 2, z: 1 }, usableSides: ['positiveX']
    });
    const diningChair = item('dining-chair', 'dining-seat');

    const result = new FunctionalLayoutEvaluator().evaluate(room([
      [diningTable, { x: 4, z: 4 }],
      [diningChair, { x: 2.5, z: 4 }]
    ]), [diningRule]);

    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toMatchObject({
      constraintId: 'dining-seating-required', actualValue: 0, threshold: 1,
      itemIds: ['dining-table'], messageKey: 'functional-dining-seat-required'
    });
  });

  it('requires a lounge seat front axis to face its view target', () => {
    const sofa = item('sofa', 'lounge-seat', {
      dimensions: { x: 2, z: 1 }, frontAxis: 'positiveZ'
    });
    const television = item('television', 'view-target', { dimensions: { x: 1.6, z: 0.3 } });
    const rule = new FunctionalLayoutRule({
      schemaVersion: 1,
      id: 'lounge-seat-faces-view-target',
      kind: 'front-adjacency',
      anchorSelector: { affordance: 'lounge-seat' },
      partnerSelector: { affordance: 'view-target' },
      minPartners: 1,
      distance: { min: 1, max: 4 },
      maxAngleDegrees: 30,
      weight: 1.3,
      messageKey: 'functional-lounge-faces-view-target'
    });

    const facingResult = new FunctionalLayoutEvaluator().evaluate(room([
      [sofa, { x: 4, z: 3 }],
      [television, { x: 4, z: 5 }]
    ]), [rule]);
    const awayResult = new FunctionalLayoutEvaluator().evaluate(room([
      [sofa, { x: 4, z: 3 }, 180],
      [television, { x: 4, z: 5 }]
    ]), [rule]);

    expect(facingResult.violations).toEqual([]);
    expect(facingResult.matchedPairs).toEqual([['sofa', 'television']]);
    expect(awayResult.violations).toHaveLength(1);
    expect(awayResult.violations[0]).toMatchObject({
      constraintId: 'lounge-seat-faces-view-target', itemIds: ['sofa'], actualValue: 0
    });
  });

  it('requires a coffee surface to be in front of the lounge seat', () => {
    const sofa = item('sofa', 'lounge-seat', {
      dimensions: { x: 2, z: 1 }, frontAxis: 'positiveZ'
    });
    const coffeeTable = item('coffee-table', 'coffee-surface', { dimensions: { x: 1, z: 0.6 } });
    const rule = new FunctionalLayoutRule({
      schemaVersion: 1,
      id: 'coffee-surface-in-front-of-lounge-seat',
      kind: 'front-adjacency',
      anchorSelector: { affordance: 'lounge-seat' },
      partnerSelector: { affordance: 'coffee-surface' },
      minPartners: 1,
      distance: { min: 0.1, max: 0.6 },
      maxAngleDegrees: 30,
      weight: 0.9,
      messageKey: 'functional-coffee-surface-in-front-of-lounge-seat'
    });

    const inFront = new FunctionalLayoutEvaluator().evaluate(room([
      [sofa, { x: 4, z: 3 }],
      [coffeeTable, { x: 4, z: 4.2 }]
    ]), [rule]);
    const behind = new FunctionalLayoutEvaluator().evaluate(room([
      [sofa, { x: 4, z: 3 }],
      [coffeeTable, { x: 4, z: 1.8 }]
    ]), [rule]);

    expect(inFront.violations).toEqual([]);
    expect(behind.violations).toHaveLength(1);
    expect(behind.violations[0]).toMatchObject({
      constraintId: 'coffee-surface-in-front-of-lounge-seat', itemIds: ['sofa'], actualValue: 0
    });
  });

  it('consumes a dining chair at most once, so one chair cannot satisfy two tables', () => {
    const tableA = item('table-a', 'dining-surface', {
      dimensions: { x: 1, z: 1 }, usableSides: ['positiveX']
    });
    const tableB = item('table-b', 'dining-surface', {
      dimensions: { x: 1, z: 1 }, usableSides: ['negativeX']
    });
    const diningChair = item('dining-chair', 'dining-seat');

    const result = new FunctionalLayoutEvaluator().evaluate(room([
      [tableA, { x: 3, z: 4 }],
      [tableB, { x: 5, z: 4 }],
      [diningChair, { x: 4, z: 4 }]
    ]), [diningRule]);

    expect(result.matchedPairs).toEqual([['dining-chair', 'table-a']]);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toMatchObject({ itemIds: ['table-b'], actualValue: 0, severity: 1 });
  });
});
