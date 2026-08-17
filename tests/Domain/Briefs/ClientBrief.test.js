import { describe, expect, it } from 'vitest';
import ClientBrief from '../../../src/Domain/Briefs/ClientBrief.js';

const validBrief = {
  schemaVersion: 1,
  id: 'brief-warm-host-001',
  levelId: 'level-001',
  client: {
    id: 'client-warm-host',
    displayName: 'Марина и Алексей'
  },
  title: 'Гостиная для тёплых ужинов',
  summary: 'Нужна спокойная гостиная с местом для ужинов и разговоров.',
  styleTargets: [
    { styleId: 'scandinavian', role: 'primary', weight: 0.7 },
    { styleId: 'japandi', role: 'secondary', weight: 0.2 },
    { styleId: 'eclectic', role: 'accent', weight: 0.1 }
  ],
  clientPriorities: [
    { id: 'host-guests', label: 'Принимать гостей', weight: 1.3 },
    { id: 'keep-circulation', label: 'Сохранять свободный вход', weight: 1.1 }
  ],
  spatialPreferences: {
    density: 'intimate',
    clearanceMultiplier: 0.75,
    emptySpacePreference: {
      mode: 'discourage-excess',
      targetFreeAreaRatio: 0.42,
      weight: 0.8
    }
  },
  evaluationPolicy: {
    styleMode: 'weighted-targets-v1',
    completion: { minimumStars: 3, criticalRuleMode: 'block-completion' },
    compositionRules: { minItems: 4, requiredRoles: ['seating', 'surface', 'lighting'] },
    ergonomicsRules: {
      minimumClearance: { minimumDistance: 0.9, weight: 1 },
      passageZones: [],
      functionalLayoutRules: [],
      requiredFunctionalScenarios: [
        {
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
        }
      ]
    }
  }
};

describe('ClientBrief', () => {
  it('freezes a complete, client-owned and multi-style deterministic evaluation input', () => {
    const brief = new ClientBrief(validBrief);

    expect(brief.id).toBe('brief-warm-host-001');
    expect(brief.levelId).toBe('level-001');
    expect(brief.primaryStyleTarget).toEqual({ styleId: 'scandinavian', role: 'primary', weight: 0.7 });
    expect(brief.styleTargets).toHaveLength(3);
    expect(brief.clientPriorities).toEqual(validBrief.clientPriorities);
    expect(brief.spatialPreferences.clearanceMultiplier).toBe(0.75);
    expect(brief.evaluationPolicy.completion.criticalRuleMode).toBe('block-completion');
    expect(brief.evaluationPolicy.ergonomicsRules.requiredFunctionalScenarios).toEqual(
      validBrief.evaluationPolicy.ergonomicsRules.requiredFunctionalScenarios
    );
    expect(Object.isFrozen(brief.evaluationPolicy.ergonomicsRules.requiredFunctionalScenarios)).toBe(true);
    expect(Object.isFrozen(brief)).toBe(true);
    expect(Object.isFrozen(brief.styleTargets)).toBe(true);
    expect(Object.isFrozen(brief.spatialPreferences)).toBe(true);
  });

  it('rejects a brief with malformed required functional scenario policy', () => {
    expect(() => new ClientBrief({
      ...validBrief,
      evaluationPolicy: {
        ...validBrief.evaluationPolicy,
        ergonomicsRules: {
          ...validBrief.evaluationPolicy.ergonomicsRules,
          requiredFunctionalScenarios: [{ ...validBrief.evaluationPolicy.ergonomicsRules.requiredFunctionalScenarios[0], id: '' }]
        }
      }
    })).toThrow('RequiredFunctionalScenario id must be a non-empty string');
  });

  it('accepts V2 priorities only when each client request owns a schema-versioned evaluation rule', () => {
    const priorityRules = [
      {
        ...validBrief.clientPriorities[0],
        rule: {
          schemaVersion: 1,
          kind: 'functional-scenario',
          scenarioId: 'dining-hosting',
          messageKey: 'priority-host-guests'
        }
      },
      {
        ...validBrief.clientPriorities[1],
        rule: {
          schemaVersion: 1,
          kind: 'spatial-preferences',
          messageKey: 'priority-keep-circulation'
        }
      }
    ];
    const brief = new ClientBrief({ ...validBrief, schemaVersion: 2, clientPriorities: priorityRules });

    expect(brief.schemaVersion).toBe(2);
    expect(brief.clientPriorities).toEqual(priorityRules);
    expect(Object.isFrozen(brief.clientPriorities[0].rule)).toBe(true);

    expect(() => new ClientBrief({
      ...validBrief,
      schemaVersion: 2,
      clientPriorities: [{ ...priorityRules[0], rule: undefined }, priorityRules[1]]
    })).toThrow('ClientBrief clientPriorities[0].rule must be an object');
  });

  it('rejects a brief without one normalized primary style target or valid client-specific spatial policy', () => {
    expect(() => new ClientBrief({
      ...validBrief,
      styleTargets: [{ styleId: 'scandinavian', role: 'secondary', weight: 1 }]
    })).toThrow('ClientBrief requires exactly one primary style target');

    expect(() => new ClientBrief({
      ...validBrief,
      spatialPreferences: { ...validBrief.spatialPreferences, clearanceMultiplier: 0 }
    })).toThrow('ClientBrief spatialPreferences clearanceMultiplier must be between 0.25 and 2');
  });
});
