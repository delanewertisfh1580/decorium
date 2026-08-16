import { describe, expect, it } from 'vitest';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import InteractionProfile from '../../../src/Domain/Items/InteractionProfile.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import RequiredFunctionalScenario from '../../../src/Domain/Ergonomics/RequiredFunctionalScenario.js';
import RequiredFunctionalScenarioEvaluator from '../../../src/Domain/Ergonomics/RequiredFunctionalScenarioEvaluator.js';

function createItem(id, affordances) {
  return new Item({
    id,
    name: id,
    type: 'furniture',
    dimensions: { x: 0.5, z: 0.5 },
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
    interactionProfile: new InteractionProfile({ schemaVersion: 1, affordances, frontAxis: null, usableSides: [] })
  });
}

function diningScenario() {
  return new RequiredFunctionalScenario({
    schemaVersion: 1,
    id: 'dining-hosting',
    label: 'Обеденная группа',
    requiredRoles: [
      { affordance: 'dining-surface', minCount: 1 },
      { affordance: 'dining-seat', minCount: 2 }
    ],
    weight: 1.3,
    critical: true,
    messageKey: 'scenario-dining-hosting-required'
  });
}

function roomWith(...items) {
  const room = RoomState.createEmpty(new RoomBounds(8, 6));
  items.forEach((item, index) => {
    expect(room.placeItem(item, { x: 1 + index, z: 1 }).success).toBe(true);
  });
  return room;
}

describe('RequiredFunctionalScenarioEvaluator', () => {
  it('reports every missing role when the room contains no scenario anchors', () => {
    const violations = new RequiredFunctionalScenarioEvaluator().evaluate(roomWith(), [diningScenario()]);

    expect(violations).toHaveLength(2);
    expect(violations.map(violation => ({
      constraintId: violation.constraintId,
      threshold: violation.threshold,
      actualValue: violation.actualValue,
      critical: violation.critical
    }))).toEqual([
      { constraintId: 'required-scenario:dining-hosting:dining-surface', threshold: 1, actualValue: 0, critical: true },
      { constraintId: 'required-scenario:dining-hosting:dining-seat', threshold: 2, actualValue: 0, critical: true }
    ]);
  });

  it('keeps an incomplete scenario violated and reports matching instance IDs as causal evidence', () => {
    const table = createItem('table-001', ['dining-surface']);
    const chair = createItem('chair-001', ['dining-seat']);

    const violations = new RequiredFunctionalScenarioEvaluator().evaluate(roomWith(table, chair), [diningScenario()]);

    expect(violations).toHaveLength(1);
    expect(violations[0].constraintId).toBe('required-scenario:dining-hosting:dining-seat');
    expect(violations[0].actualValue).toBe(1);
    expect(violations[0].threshold).toBe(2);
    expect(violations[0].severity).toBeCloseTo(0.5, 5);
    expect(violations[0].itemIds).toEqual(['chair-001']);
    expect(violations[0].constraint.weight).toBe(1.3);
  });

  it('passes only when all required role cardinalities are present', () => {
    const table = createItem('table-001', ['dining-surface']);
    const firstChair = createItem('chair-001', ['dining-seat']);
    const secondChair = createItem('chair-002', ['dining-seat']);

    expect(new RequiredFunctionalScenarioEvaluator().evaluate(
      roomWith(table, firstChair, secondChair),
      [diningScenario()]
    )).toEqual([]);
  });
});
