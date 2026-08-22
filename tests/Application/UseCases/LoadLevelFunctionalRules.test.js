import { describe, expect, it } from 'vitest';
import { LoadLevelUseCase } from '../../../src/Application/UseCases/LoadLevelUseCase.js';
import FunctionalLayoutRule from '../../../src/Domain/Ergonomics/FunctionalLayoutRule.js';
import { asV2Level, loadLevelV2Dependencies } from '../../Fixtures/loadLevelV2Dependencies.js';

const functionalRule = {
  schemaVersion: 1,
  id: 'dining-seating',
  kind: 'adjacency',
  anchorSelector: { affordance: 'dining-surface' },
  partnerSelector: { affordance: 'dining-seat' },
  minPartners: 2,
  distance: { min: 0.05, max: 0.35 },
  weight: 1.2,
  messageKey: 'functional-dining-seat-required'
};

describe('LoadLevelUseCase V2 functional layout rules', () => {
  it('hydrates client-owned functionalLayoutRules into immutable Domain rules in EvaluationSpec', async () => {
    const levelRepository = {
      loadLevel: async () => asV2Level({
        id: 'functional-room',
        roomId: 'functional-room',
        name: 'Functional room',
        roomDimensions: { width: 5, depth: 5 },
        availableItems: [],
        clientBriefId: 'brief-functional',
        presentationProfileId: 'functional-environment'
      })
    };
    const clientBriefRepository = {
      getById: async () => ({
        schemaVersion: 2,
        id: 'brief-functional',
        levelId: 'functional-room',
        client: { id: 'client-functional', displayName: 'Клиент' },
        title: 'Functional room',
        summary: 'Проверка связи предметов.',
        styleTargets: [{ styleId: 'scandinavian', role: 'primary', weight: 1 }],
        clientPriorities: [{
          id: 'priority-functional', label: 'Обеденная группа', weight: 1,
          rule: { schemaVersion: 1, kind: 'functional-scenario', scenarioId: 'dining-hosting', messageKey: 'priority-dining' }
        }],
        spatialPreferences: {
          density: 'balanced', clearanceMultiplier: 1,
          emptySpacePreference: { mode: 'allow', targetFreeAreaRatio: 0.5 }
        },
        evaluationPolicy: {
          styleMode: 'weighted-targets-v1',
          completion: { minimumStars: 3, criticalRuleMode: 'informational' },
          compositionRules: {},
          ergonomicsRules: {
            functionalLayoutRules: [functionalRule],
            requiredFunctionalScenarios: [],
            passageZones: []
          }
        }
      })
    };

    const result = await new LoadLevelUseCase(
      levelRepository,
      { getItemsByIds: async () => [] },
      { getStyleProfileById: async () => ({ id: 'scandinavian', label: 'Скандинавский', constraints: [{ id: 'constraint' }] }) },
      { getById: async () => ({ id: 'functional-environment' }) },
      clientBriefRepository,
      loadLevelV2Dependencies()
    ).execute('functional-room');

    expect(result.success).toBe(true);
    expect(result.data.evaluationSpec.ergonomicsRules.functionalLayoutRules).toHaveLength(1);
    expect(result.data.evaluationSpec.ergonomicsRules.functionalLayoutRules[0]).toBeInstanceOf(FunctionalLayoutRule);
    expect(result.data.evaluationSpec.ergonomicsRules.functionalLayoutRules[0].minPartners).toBe(2);
    expect(Object.isFrozen(result.data.evaluationSpec.ergonomicsRules.functionalLayoutRules)).toBe(true);
  });
});
