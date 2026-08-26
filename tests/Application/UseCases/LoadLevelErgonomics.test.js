import { describe, expect, it } from 'vitest';
import MinimumClearanceRule from '../../../src/Domain/Ergonomics/MinimumClearanceRule.js';
import PassageZone from '../../../src/Domain/Ergonomics/PassageZone.js';
import LoadLevelUseCase from '../../../src/Application/UseCases/LoadLevelUseCase.js';
import { asV2Level, loadLevelV2Dependencies } from '../../Fixtures/loadLevelV2Dependencies.js';

const rawLevel = asV2Level({
  id: 'level-001',
  roomId: 'room-001',
  name: 'Test level',
  roomDimensions: { width: 6, depth: 5 },
  availableItems: ['chair-001'],
  clientBriefId: 'brief-001',
  presentationProfileId: 'test-environment',
});
const rawBrief = {
  schemaVersion: 3,
  id: 'brief-001',
  levelId: 'level-001',
  client: { id: 'client-001', displayName: 'Клиент' },
  title: 'Тест',
  summary: 'Тестовый brief.',
  styleTargets: [{ styleId: 'scandinavian', role: 'primary', weight: 1 }],
  clientPriorities: [{
    id: 'priority-001', label: 'Свободный вход', weight: 1,
    rule: { schemaVersion: 1, kind: 'spatial-preferences', messageKey: 'priority-clearance' }
  }],
  spatialPreferences: {
    density: 'balanced', clearanceMultiplier: 1,
    emptySpacePreference: { mode: 'allow', targetFreeAreaRatio: 0.5 }
  },
  evaluationPolicy: {
    styleMode: 'weighted-targets-v1',
    functionalSatisfactionPolicy: { schemaVersion: 1, mode: 'demand-weighted-coverage' },
    completion: { minimumStars: 3, criticalRuleMode: 'informational' },
    compositionRules: {},
    ergonomicsRules: {
      minimumClearance: { minimumDistance: 0.9, weight: 1.5 },
      passageZones: [{ id: 'entry', label: 'Вход', x: 0, z: 2, width: 1.2, depth: 2, weight: 1.4 }],
      functionalLayoutRules: [],
      requiredFunctionalScenarios: []
    }
  }
};

describe('LoadLevelUseCase V3 ergonomics rules', () => {
  it('hydrates brief-owned clearance and passage policy as immutable Domain rules in EvaluationSpec', async () => {
    const useCase = new LoadLevelUseCase(
      { loadLevel: async () => rawLevel },
      { getItemsByIds: async () => [{ id: 'chair-001' }] },
      { getStyleProfileById: async () => ({ id: 'scandinavian', label: 'Скандинавский', constraints: [{ id: 'constraint' }] }) },
      { getById: async () => ({ id: 'test-environment' }) },
      { getById: async () => rawBrief },
      loadLevelV2Dependencies()
    );

    const result = await useCase.execute('level-001');

    expect(result.success).toBe(true);
    expect(result.data.evaluationSpec.ergonomicsRules.minimumClearance).toBeInstanceOf(MinimumClearanceRule);
    expect(result.data.evaluationSpec.ergonomicsRules.minimumClearance.minimumDistance).toBe(0.9);
    expect(result.data.evaluationSpec.ergonomicsRules.minimumClearance.weight).toBe(1.5);
    expect(result.data.evaluationSpec.ergonomicsRules.passageZones[0]).toBeInstanceOf(PassageZone);
    expect(result.data.evaluationSpec.ergonomicsRules.passageZones[0].label).toBe('Вход');
  });

  it('appends opening-derived passage zones after brief-owned zones when the environment defines an openings preset', async () => {
    const useCase = new LoadLevelUseCase(
      { loadLevel: async () => rawLevel },
      { getItemsByIds: async () => [{ id: 'chair-001' }] },
      { getStyleProfileById: async () => ({ id: 'scandinavian', label: 'Скандинавский', constraints: [{ id: 'constraint' }] }) },
      { getById: async () => ({ id: 'test-environment', room: { openingsPreset: 'living-window-and-door' } }) },
      { getById: async () => rawBrief },
      loadLevelV2Dependencies()
    );

    const result = await useCase.execute('level-001');

    expect(result.success).toBe(true);
    const zones = result.data.evaluationSpec.ergonomicsRules.passageZones;
    expect(zones).toHaveLength(3);
    expect(zones[0].label).toBe('Вход');
    expect(zones[1].id).toBe('opening-door');
    expect(zones[1].messageKey).toBe('ergonomics-opening-door-free');
    // Door centerZ = 5 * 0.72 = 3.6, half width 0.45, swing margin 0.05.
    expect(zones[1].z).toBeCloseTo(3.1, 5);
    expect(zones[2].id).toBe('opening-window');
    expect(zones[2].messageKey).toBe('ergonomics-opening-window-free');
    expect(zones[2].z + zones[2].depth).toBe(5);
  });
});
