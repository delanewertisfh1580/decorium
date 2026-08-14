import { describe, expect, it } from 'vitest';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import MinimumClearanceRule from '../../../src/Domain/Ergonomics/MinimumClearanceRule.js';
import PassageZone from '../../../src/Domain/Ergonomics/PassageZone.js';
import FunctionalLayoutRule from '../../../src/Domain/Ergonomics/FunctionalLayoutRule.js';
import SpatialErgonomicsEvaluator from '../../../src/Domain/Ergonomics/SpatialErgonomicsEvaluator.js';

const vector = new FeatureVector({
  woodShare: 0.7, metalShare: 0.1, glassShare: 0.05, plasticShare: 0.05, textileShare: 0.1,
  lightColorShare: 0.7, darkColorShare: 0.3, warmPaletteShare: 0.6, saturationLevel: 0.3,
  formSimplicity: 0.8, roundnessShare: 0.2, rectilinearShare: 0.8, sizeNorm: 0.5,
  priceNorm: 0.5, lightingFunctionShare: 0, storageFunctionShare: 0
});

function chair(id) {
  return new Item({ id, name: id, type: 'seating', dimensions: { x: 1, z: 1 }, featureVector: vector });
}

function semanticItem(id, affordance, dimensions, usableSides = []) {
  return new Item({
    id, name: id, type: 'surface', dimensions, featureVector: vector,
    interactionProfile: new InteractionProfile({ schemaVersion: 1, affordances: [affordance], usableSides })
  });
}

describe('SpatialErgonomicsEvaluator', () => {
  it('combines the active rule families in deterministic channel order', () => {
    const room = RoomState.createEmpty(new RoomBounds(8, 6));
    room.placeItem(chair('chair-a'), { x: 0.5, z: 2.5 });
    room.placeItem(chair('chair-b'), { x: 1.1, z: 2.5 });
    const rules = {
      minimumClearance: new MinimumClearanceRule({ minimumDistance: 0.9 }),
      passageZones: [new PassageZone({ id: 'entry', label: 'Вход', x: 0, z: 2, width: 1.4, depth: 2 })]
    };

    const violations = new SpatialErgonomicsEvaluator().evaluate(room, rules);

    expect(violations.map(violation => violation.constraintId)).toEqual([
      'ergonomics-minimum-clearance',
      'ergonomics-passage-zone-free',
      'ergonomics-passage-zone-free'
    ]);
  });

  it('evaluates functional rules before clearance and exempts confirmed dining pairs from clearance', () => {
    const room = RoomState.createEmpty(new RoomBounds(8, 6));
    room.placeItem(semanticItem('dining-table', 'dining-surface', { x: 2, z: 1 }, ['positiveX']), { x: 4, z: 3 });
    room.placeItem(semanticItem('dining-chair', 'dining-seat', { x: 0.5, z: 0.5 }), { x: 5.5, z: 3 });
    const rules = {
      minimumClearance: new MinimumClearanceRule({ minimumDistance: 0.9 }),
      functionalLayoutRules: [new FunctionalLayoutRule({
        schemaVersion: 1,
        id: 'dining-seating-required',
        kind: 'adjacency',
        anchorSelector: { affordance: 'dining-surface' },
        partnerSelector: { affordance: 'dining-seat' },
        minPartners: 1,
        distance: { min: 0.05, max: 0.35 },
        weight: 1.2,
        messageKey: 'functional-dining-seat-required'
      })]
    };

    expect(new SpatialErgonomicsEvaluator().evaluate(room, rules)).toEqual([]);
  });
});
