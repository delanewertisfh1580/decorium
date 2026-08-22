import { describe, expect, it } from 'vitest';
import ClientPriorityEvaluator from '../../../src/Domain/Scoring/ClientPriorityEvaluator.js';

const functionalPolicy = Object.freeze({ schemaVersion: 1, mode: 'demand-weighted-coverage' });

function roomStateFor(affordancesByInstance) {
  return {
    getItems: () => affordancesByInstance.map(({ id, affordances }) => ({
      id,
      item: { interactionProfile: { hasAffordance: affordance => affordances.includes(affordance) } }
    }))
  };
}

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

describe('ClientPriorityEvaluator', () => {
  it('awards demand-weighted partial functional coverage and keeps completeness as a separate hard fact', () => {
    const priorities = [
      {
        id: 'host-guests', label: 'Принимать гостей', weight: 2,
        rule: { schemaVersion: 1, kind: 'functional-scenario', scenarioId: 'dining-hosting', messageKey: 'priority-host-guests' }
      },
      {
        id: 'warm-intimacy', label: 'Камерная атмосфера', weight: 1,
        rule: { schemaVersion: 1, kind: 'spatial-preferences', messageKey: 'priority-warm-intimacy' }
      }
    ];
    const scenarios = [{
      id: 'dining-hosting',
      requiredRoles: [
        { affordance: 'dining-surface', minCount: 1 },
        { affordance: 'dining-seat', minCount: 2 }
      ]
    }];

    const result = evaluator.evaluate({
      priorities,
      scenarios,
      roomState: roomStateFor([
        { id: 'table-001#1', affordances: ['dining-surface'] },
        { id: 'chair-001#1', affordances: ['dining-seat'] }
      ]),
      occupancyProfile: { freeAreaRatio: 0.7 },
      spatialPreferences: { density: 'intimate', emptySpacePreference: { mode: 'discourage-excess', targetFreeAreaRatio: 0.42 } },
      functionalSatisfactionPolicy: functionalPolicy
    });

    expect(result.score).toBeCloseTo((2 * (2 / 3) + 1 * 0.5) / 3, 12);
    expect(result.results[0]).toMatchObject({
      id: 'host-guests',
      ruleKind: 'functional-scenario',
      functionalSatisfactionMode: 'demand-weighted-coverage',
      satisfaction: 0.666666666667,
      scenarioComplete: false,
      satisfied: false,
      missingUnits: 1,
      itemIds: ['chair-001#1', 'table-001#1']
    });
    expect(result.results[0].roleCoverage).toEqual([
      { affordance: 'dining-surface', requiredCount: 1, actualCount: 1, missingCount: 0, coverage: 1, itemIds: ['table-001#1'] },
      { affordance: 'dining-seat', requiredCount: 2, actualCount: 1, missingCount: 1, coverage: 0.5, itemIds: ['chair-001#1'] }
    ]);
    expect(result.violations[0]).toMatchObject({
      constraintId: 'client-priority:host-guests', severity: 0.333333333333, actualValue: 0.666666666667, threshold: 1
    });
  });

  it('caps role coverage at one and reports functional completion only when every role is complete', () => {
    const result = evaluator.evaluate({
      priorities: [{
        id: 'host-guests', label: 'Принимать гостей', weight: 1,
        rule: { schemaVersion: 1, kind: 'functional-scenario', scenarioId: 'dining-hosting', messageKey: 'priority-host-guests' }
      }],
      scenarios: [{
        id: 'dining-hosting',
        requiredRoles: [
          { affordance: 'dining-surface', minCount: 1 },
          { affordance: 'dining-seat', minCount: 2 }
        ]
      }],
      roomState: roomStateFor([
        { id: 'table-001#1', affordances: ['dining-surface'] },
        { id: 'chair-001#1', affordances: ['dining-seat'] },
        { id: 'chair-002#1', affordances: ['dining-seat'] },
        { id: 'chair-003#1', affordances: ['dining-seat'] }
      ]),
      occupancyProfile: { freeAreaRatio: 0.5 },
      spatialPreferences: { density: 'balanced', emptySpacePreference: { mode: 'allow', targetFreeAreaRatio: 0.5 } },
      functionalSatisfactionPolicy: functionalPolicy
    });

    expect(result.score).toBe(1);
    expect(result.results[0]).toMatchObject({ satisfaction: 1, scenarioComplete: true, satisfied: true, missingUnits: 0, violation: null });
    expect(result.results[0].roleCoverage[1]).toMatchObject({ actualCount: 3, requiredCount: 2, coverage: 1, missingCount: 0 });
  });

  it('rejects functional scoring without an explicit supported satisfaction policy', () => {
    expect(() => evaluator.evaluate({
      priorities: [{
        id: 'host-guests', label: 'Принимать гостей', weight: 1,
        rule: { schemaVersion: 1, kind: 'functional-scenario', scenarioId: 'dining-hosting', messageKey: 'priority-host-guests' }
      }],
      scenarios: [{ id: 'dining-hosting', requiredRoles: [{ affordance: 'dining-seat', minCount: 1 }] }],
      roomState: roomStateFor([]),
      occupancyProfile: { freeAreaRatio: 1 },
      spatialPreferences: { density: 'balanced', emptySpacePreference: { mode: 'allow', targetFreeAreaRatio: 0.5 } }
    })).toThrow('ClientPriorityEvaluator functionalSatisfactionPolicy must use a supported mode');
  });
});
