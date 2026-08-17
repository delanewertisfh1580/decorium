import { describe, expect, it } from 'vitest';
import ClientPriorityEvaluator from '../../../src/Domain/Scoring/ClientPriorityEvaluator.js';

describe('ClientPriorityEvaluator', () => {
  it('normalizes authored priority weights and emits deterministic diagnostics for unsatisfied functional and spatial client requests', () => {
    const evaluator = new ClientPriorityEvaluator({
      spatialPreferenceEvaluator: {
        evaluate: () => ({
          satisfaction: 0.5,
          actualFreeAreaRatio: 0.7,
          minimumFreeAreaRatio: 0.34,
          maximumFreeAreaRatio: 0.42
        })
      }
    });
    const roomState = {
      getItems: () => [{
        id: 'sofa-001',
        item: { interactionProfile: { hasAffordance: affordance => affordance === 'lounge-seat' } }
      }]
    };
    const priorities = [
      {
        id: 'media-comfort', label: 'Комфортный просмотр', weight: 2,
        rule: { schemaVersion: 1, kind: 'functional-scenario', scenarioId: 'evening-media', messageKey: 'priority-media-comfort' }
      },
      {
        id: 'warm-intimacy', label: 'Камерная атмосфера', weight: 1,
        rule: { schemaVersion: 1, kind: 'spatial-preferences', messageKey: 'priority-warm-intimacy' }
      }
    ];
    const scenarios = [{
      id: 'evening-media',
      requiredRoles: [
        { affordance: 'lounge-seat', minCount: 1 },
        { affordance: 'view-target', minCount: 1 }
      ]
    }];

    const result = evaluator.evaluate({
      priorities,
      scenarios,
      roomState,
      occupancyProfile: { freeAreaRatio: 0.7 },
      spatialPreferences: { density: 'intimate', emptySpacePreference: { mode: 'discourage-excess', targetFreeAreaRatio: 0.42, weight: 0.8 } }
    });

    expect(result.score).toBeCloseTo(1 / 6, 12);
    expect(result.results).toMatchObject([
      { id: 'media-comfort', ruleKind: 'functional-scenario', satisfaction: 0, satisfied: false },
      { id: 'warm-intimacy', ruleKind: 'spatial-preferences', satisfaction: 0.5, satisfied: false }
    ]);
    expect(result.violations).toHaveLength(2);
    expect(result.violations[0]).toMatchObject({
      constraintId: 'client-priority:media-comfort', messageKey: 'priority-media-comfort', severity: 1, actualValue: 0, threshold: 1
    });
    expect(result.violations[1]).toMatchObject({
      constraintId: 'client-priority:warm-intimacy', messageKey: 'priority-warm-intimacy', severity: 0.5, actualValue: 0.5, threshold: 1
    });
  });
});
