import { describe, expect, it } from 'vitest';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { ConstraintEvaluator } from '../../../src/Domain/Constraints/ConstraintEvaluator.js';
import { StyleScorer } from '../../../src/Domain/Scoring/StyleScorer.js';
import { StarRatingPolicy } from '../../../src/Domain/Scoring/StarRatingPolicy.js';
import EvaluateRoomUseCase from '../../../src/Application/UseCases/EvaluateRoomUseCase.js';

function item(id) {
  return new Item({
    id,
    name: id,
    type: 'seating',
    dimensions: { x: 1, z: 1 },
    featureVector: new FeatureVector({
      woodShare: 0.7, metalShare: 0.1, glassShare: 0.05, plasticShare: 0.05, textileShare: 0.1,
      lightColorShare: 0.7, darkColorShare: 0.3, warmPaletteShare: 0.6, saturationLevel: 0.3,
      formSimplicity: 0.8, roundnessShare: 0.2, rectilinearShare: 0.8, sizeNorm: 0.5,
      priceNorm: 0.5, lightingFunctionShare: 0, storageFunctionShare: 0
    })
  });
}

function activeRoom() {
  const room = RoomState.createEmpty(new RoomBounds(8, 6));
  room.placeItem(item('chair-a'), { x: 1, z: 1 });
  room.placeItem(item('chair-b'), { x: 2, z: 1 });
  return room;
}

describe('EvaluateRoomUseCase ergonomics channel', () => {
  it('keeps style and ergonomics scores visible while using the aggregated score for stars', async () => {
    const clearanceViolation = {
      constraintId: 'ergonomics-minimum-clearance',
      featureName: 'minimumClearance',
      operator: '>=',
      threshold: 0.9,
      actualValue: 0,
      severity: 1,
      messageKey: 'ergonomics-minimum-clearance',
      itemIds: ['chair-a', 'chair-b'],
      constraint: { weight: 1, description: 'Недостаточный проход.' }
    };
    const rules = {
      minimumClearance: { minimumDistance: 0.9 },
      passageZones: [{ id: 'entry' }]
    };
    const ergonomicsEvaluator = {
      evaluate: (_room, receivedRules) => {
        expect(receivedRules).toBe(rules);
        return [clearanceViolation];
      }
    };
    const ergonomicsScorer = { evaluate: violations => ({ penalty: 1, score: 0.5, violations }) };
    const scoreAggregator = { aggregate: () => ({ totalScore: 0.85, styleWeight: 0.7, ergonomicsWeight: 0.3 }) };
    const useCase = new EvaluateRoomUseCase(
      { getState: async () => activeRoom() },
      new ConstraintEvaluator(),
      new StyleScorer({ maxPenalty: 1 }),
      new StarRatingPolicy({ 0: 0, 1: 0.2, 2: 0.4, 3: 0.6, 4: 0.8, 5: 0.9 }),
      null,
      ergonomicsEvaluator,
      ergonomicsScorer,
      scoreAggregator
    );

    const result = await useCase.execute('room-001', [], {}, rules);

    expect(result.success).toBe(true);
    expect(result.evaluationData).toMatchObject({
      score: 0.85,
      styleScore: 1,
      ergonomicsScore: 0.5,
      stylePenalty: 0,
      ergonomicsPenalty: 1,
      scoreWeights: { style: 0.7, ergonomics: 0.3 }
    });
    expect(result.evaluationData.stars).toBe(4);
    expect(result.evaluationData.violations).toContainEqual(expect.objectContaining({
      type: 'ergonomics',
      itemIds: ['chair-a', 'chair-b'],
      messageKey: 'ergonomics-minimum-clearance'
    }));
  });

  it('activates the ergonomics channel for functional-only rules and serializes functional feedback', async () => {
    const functionalViolation = {
      constraintId: 'dining-seating-required',
      featureName: 'functionalLayout',
      operator: '>=',
      threshold: 2,
      actualValue: 0,
      severity: 1,
      messageKey: 'functional-dining-seat-required',
      itemIds: ['dining-table'],
      constraint: { weight: 1.2, description: 'Добавьте места для сидения у стола.' }
    };
    const rules = { functionalLayoutRules: [{ id: 'dining-seating-required' }] };
    const ergonomicsEvaluator = {
      evaluate: (_room, receivedRules) => {
        expect(receivedRules).toBe(rules);
        return [functionalViolation];
      }
    };
    const ergonomicsScorer = {
      evaluate: violations => {
        expect(violations).toEqual([functionalViolation]);
        return { penalty: 1.2, score: 0.4, violations };
      }
    };
    const scoreAggregator = { aggregate: () => ({ totalScore: 0.82, styleWeight: 0.7, ergonomicsWeight: 0.3 }) };
    const useCase = new EvaluateRoomUseCase(
      { getState: async () => activeRoom() },
      new ConstraintEvaluator(),
      new StyleScorer({ maxPenalty: 1 }),
      new StarRatingPolicy({ 0: 0, 1: 0.2, 2: 0.4, 3: 0.6, 4: 0.8, 5: 0.9 }),
      null,
      ergonomicsEvaluator,
      ergonomicsScorer,
      scoreAggregator
    );

    const result = await useCase.execute('room-001', [], {}, rules);

    expect(result.success).toBe(true);
    expect(result.evaluationData).toMatchObject({ score: 0.82, ergonomicsScore: 0.4 });
    expect(result.evaluationData.violations).toContainEqual(expect.objectContaining({
      type: 'ergonomics',
      feature: 'functionalLayout',
      itemIds: ['dining-table'],
      messageKey: 'functional-dining-seat-required'
    }));
  });

  it('preserves missing required-scenario diagnostics for an empty room', async () => {
    const scenarioViolation = {
      constraintId: 'required-scenario:dining-hosting:dining-surface',
      featureName: 'requiredFunctionalScenario',
      operator: '>=',
      threshold: 1,
      actualValue: 0,
      severity: 1,
      critical: true,
      messageKey: 'scenario-dining-hosting-required',
      itemIds: [],
      constraint: { weight: 1.3, description: 'Клиентская функциональная группа неполна.' }
    };
    const rules = { requiredFunctionalScenarios: [{ id: 'dining-hosting' }] };
    const emptyRoom = RoomState.createEmpty(new RoomBounds(8, 6));
    const ergonomicsEvaluator = { evaluate: () => [scenarioViolation] };
    const useCase = new EvaluateRoomUseCase(
      { getState: async () => emptyRoom },
      new ConstraintEvaluator(),
      new StyleScorer({ maxPenalty: 1 }),
      new StarRatingPolicy({ 0: 0, 1: 0.2, 2: 0.4, 3: 0.6, 4: 0.8, 5: 0.9 }),
      null,
      ergonomicsEvaluator,
      { evaluate: () => ({ penalty: 1.3, score: 0, violations: [scenarioViolation] }) },
      { aggregate: () => ({ totalScore: 0, styleWeight: 0.7, ergonomicsWeight: 0.3 }) }
    );

    const result = await useCase.execute('room-001', [], {}, rules);

    expect(result.success).toBe(true);
    expect(result.evaluationData.violations).toContainEqual(expect.objectContaining({
      type: 'ergonomics',
      feature: 'requiredFunctionalScenario',
      critical: true,
      messageKey: 'scenario-dining-hosting-required'
    }));
  });

  it('activates the ergonomics channel for required-scenario-only rules and serializes critical diagnostics', async () => {
    const scenarioViolation = {
      constraintId: 'required-scenario:evening-media:view-target',
      featureName: 'requiredFunctionalScenario',
      operator: '>=',
      threshold: 1,
      actualValue: 0,
      severity: 1,
      critical: true,
      messageKey: 'scenario-evening-media-required',
      itemIds: [],
      constraint: { weight: 1.3, description: 'Клиентская функциональная группа неполна.' }
    };
    const rules = { requiredFunctionalScenarios: [{ id: 'evening-media' }] };
    const ergonomicsEvaluator = {
      evaluate: (_room, receivedRules) => {
        expect(receivedRules).toBe(rules);
        return [scenarioViolation];
      }
    };
    const ergonomicsScorer = { evaluate: violations => ({ penalty: 1.3, score: 0.35, violations }) };
    const scoreAggregator = { aggregate: () => ({ totalScore: 0.76, styleWeight: 0.7, ergonomicsWeight: 0.3 }) };
    const useCase = new EvaluateRoomUseCase(
      { getState: async () => activeRoom() },
      new ConstraintEvaluator(),
      new StyleScorer({ maxPenalty: 1 }),
      new StarRatingPolicy({ 0: 0, 1: 0.2, 2: 0.4, 3: 0.6, 4: 0.8, 5: 0.9 }),
      null,
      ergonomicsEvaluator,
      ergonomicsScorer,
      scoreAggregator
    );

    const result = await useCase.execute('room-001', [], {}, rules);

    expect(result.success).toBe(true);
    expect(result.evaluationData.violations).toContainEqual(expect.objectContaining({
      type: 'ergonomics',
      feature: 'requiredFunctionalScenario',
      messageKey: 'scenario-evening-media-required'
    }));
  });
});
