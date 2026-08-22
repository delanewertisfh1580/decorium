import { describe, expect, it, vi } from 'vitest';
import ClientBrief from '../../../src/Domain/Briefs/ClientBrief.js';
import RequiredFunctionalScenario from '../../../src/Domain/Ergonomics/RequiredFunctionalScenario.js';
import { LoadLevelUseCase } from '../../../src/Application/UseCases/LoadLevelUseCase.js';
import { asV2Level, loadLevelV2Dependencies } from '../../Fixtures/loadLevelV2Dependencies.js';

const item = Object.freeze({ id: 'chair-001' });
const rawLevel = asV2Level({
  id: 'level-001',
  roomId: 'room-001',
  name: 'Гостиная',
  clientBriefId: 'brief-warm-host-001',
  presentationProfileId: 'warm-starter-living',
  roomDimensions: { width: 8, depth: 6 },
  availableItems: ['chair-001']
});
const rawBrief = {
  schemaVersion: 3,
  id: 'brief-warm-host-001',
  levelId: 'level-001',
  client: { id: 'client-warm-host', displayName: 'Марина и Алексей' },
  title: 'Гостиная для тёплых ужинов',
  summary: 'Нужна спокойная гостиная.',
  styleTargets: [{ styleId: 'scandinavian', role: 'primary', weight: 1 }],
  clientPriorities: [{
    id: 'host-guests',
    label: 'Принимать гостей',
    weight: 1,
    rule: { schemaVersion: 1, kind: 'functional-scenario', scenarioId: 'dining-hosting', messageKey: 'priority-host-guests' }
  }],
  spatialPreferences: {
    density: 'balanced',
    clearanceMultiplier: 1,
    emptySpacePreference: { mode: 'allow', targetFreeAreaRatio: 0.45 }
  },
  evaluationPolicy: {
    styleMode: 'weighted-targets-v1',
    functionalSatisfactionPolicy: { schemaVersion: 1, mode: 'demand-weighted-coverage' },
    completion: { minimumStars: 4, criticalRuleMode: 'block-completion' },
    compositionRules: { minItems: 4, requiredAffordances: ['dining-seat', 'light-source'] },
    ergonomicsRules: {
      minimumClearance: { minimumDistance: 0.9, weight: 1 },
      passageZones: [],
      functionalLayoutRules: [],
      requiredFunctionalScenarios: [{
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
      }]
    }
  }
};

function createUseCase({ brief = rawBrief, profiles = null } = {}) {
  const profilesByStyleId = profiles ?? {
    scandinavian: Object.freeze({ id: 'scandinavian', label: 'Скандинавский', constraints: [Object.freeze({ id: 'scand-wood-min' })] })
  };
  return new LoadLevelUseCase(
    { loadLevel: vi.fn().mockResolvedValue(rawLevel) },
    { getItemsByIds: vi.fn().mockResolvedValue([item]) },
    { getStyleProfileById: vi.fn(styleId => Promise.resolve(profilesByStyleId[styleId] ?? null)) },
    { getById: vi.fn().mockResolvedValue({ id: 'warm-starter-living' }) },
    { getById: vi.fn().mockResolvedValue(brief) },
    loadLevelV2Dependencies()
  );
}

describe('LoadLevelUseCase ClientBrief V3 hydration', () => {
  it('derives current scoring inputs and completion target exclusively from immutable client policy', async () => {
    const result = await createUseCase().execute('level-001');

    expect(result.success).toBe(true);
    expect(result.data.clientBrief).toBeInstanceOf(ClientBrief);
    expect(result.data.targetScore).toBe(4);
    expect(result.data.evaluationSpec).toMatchObject({
      schemaVersion: 1,
      styleTargets: [{ styleId: 'scandinavian', label: 'Скандинавский', role: 'primary', weight: 1 }],
      clientPriorities: rawBrief.clientPriorities,
      spatialPreferences: rawBrief.spatialPreferences,
      functionalSatisfactionPolicy: expect.objectContaining({ schemaVersion: 1, mode: 'demand-weighted-coverage' }),
      completion: rawBrief.evaluationPolicy.completion
    });
    expect(result.data.evaluationSpec.ergonomicsRules.requiredFunctionalScenarios[0]).toBeInstanceOf(RequiredFunctionalScenario);
    expect(Object.isFrozen(result.data.evaluationSpec)).toBe(true);
  });

  it('hydrates every authored V3 style target through exact style-profile lookup', async () => {
    const mixedBrief = {
      ...rawBrief,
      styleTargets: [
        { styleId: 'scandinavian', role: 'primary', weight: 0.7 },
        { styleId: 'japandi', role: 'secondary', weight: 0.2 },
        { styleId: 'eclectic', role: 'accent', weight: 0.1 }
      ]
    };
    const profiles = {
      scandinavian: { id: 'scandinavian', label: 'Скандинавский', constraints: [{ id: 'scand' }] },
      japandi: { id: 'japandi', label: 'Japandi', constraints: [{ id: 'japandi' }] },
      eclectic: { id: 'eclectic', label: 'Эклектика', constraints: [{ id: 'eclectic' }] }
    };

    const result = await createUseCase({ brief: mixedBrief, profiles }).execute('level-001');

    expect(result.success).toBe(true);
    expect(result.data.evaluationSpec.styleTargets).toHaveLength(3);
    expect(result.data.evaluationSpec.styleTargets.map(target => target.label)).toEqual(['Скандинавский', 'Japandi', 'Эклектика']);
  });

  it('rejects absent and cross-level client policy instead of using level-side fallback rules', async () => {
    await expect(createUseCase({ brief: null }).execute('level-001')).resolves.toEqual({
      success: false,
      error: 'INVALID_LEVEL_DATA: Unknown client brief brief-warm-host-001'
    });
    await expect(createUseCase({ brief: { ...rawBrief, levelId: 'level-002' } }).execute('level-001')).resolves.toEqual({
      success: false,
      error: 'INVALID_LEVEL_DATA: Client brief brief-warm-host-001 belongs to level-002, not level-001'
    });
  });
});
