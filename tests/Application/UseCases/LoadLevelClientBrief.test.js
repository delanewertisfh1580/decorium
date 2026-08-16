import { describe, expect, it, vi } from 'vitest';
import ClientBrief from '../../../src/Domain/Briefs/ClientBrief.js';
import RequiredFunctionalScenario from '../../../src/Domain/Ergonomics/RequiredFunctionalScenario.js';
import { LoadLevelUseCase } from '../../../src/Application/UseCases/LoadLevelUseCase.js';

const item = Object.freeze({ id: 'chair-001' });
const rawLevel = {
  id: 'level-001',
  roomId: 'room-001',
  name: 'Гостиная',
  clientBriefId: 'brief-warm-host-001',
  roomDimensions: { width: 8, depth: 6 },
  availableItems: ['chair-001'],
  initialPlacement: []
};

const rawBrief = {
  schemaVersion: 1,
  id: 'brief-warm-host-001',
  levelId: 'level-001',
  client: { id: 'client-warm-host', displayName: 'Марина и Алексей' },
  title: 'Гостиная для тёплых ужинов',
  summary: 'Нужна спокойная гостиная.',
  styleTargets: [{ styleId: 'scandinavian', role: 'primary', weight: 1 }],
  clientPriorities: [{ id: 'host-guests', label: 'Принимать гостей', weight: 1 }],
  spatialPreferences: {
    density: 'balanced',
    clearanceMultiplier: 1,
    emptySpacePreference: { mode: 'allow', targetFreeAreaRatio: 0.45, weight: 0.7 }
  },
  evaluationPolicy: {
    styleMode: 'weighted-targets-v1',
    completion: { minimumStars: 4, criticalRuleMode: 'block-completion' },
    compositionRules: { minItems: 4, requiredRoles: ['seating', 'lighting'] },
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

describe('LoadLevelUseCase ClientBrief hydration', () => {
  it('derives the current scoring inputs and completion target exclusively from the resolved immutable client brief', async () => {
    const levelRepository = { loadLevel: vi.fn().mockResolvedValue(rawLevel) };
    const itemCatalog = { getItemsByIds: vi.fn().mockResolvedValue([item]) };
    const constraintCatalog = { getConstraintsByStyleId: vi.fn().mockResolvedValue([]) };
    const clientBriefRepository = { getById: vi.fn().mockResolvedValue(rawBrief) };
    const useCase = new LoadLevelUseCase(levelRepository, itemCatalog, constraintCatalog, null, clientBriefRepository);

    const result = await useCase.execute('level-001');

    expect(result.success).toBe(true);
    expect(result.data.clientBrief).toBeInstanceOf(ClientBrief);
    expect(result.data.clientBrief.id).toBe('brief-warm-host-001');
    expect(result.data.styleId).toBe('scandinavian');
    expect(result.data.targetScore).toBe(4);
    expect(result.data.compositionRules).toEqual(rawBrief.evaluationPolicy.compositionRules);
    expect(result.data.ergonomicsRules.minimumClearance.minimumDistance).toBe(0.9);
    expect(result.data.ergonomicsRules.requiredFunctionalScenarios[0]).toBeInstanceOf(RequiredFunctionalScenario);
    expect(result.data.ergonomicsRules.requiredFunctionalScenarios[0].id).toBe('dining-hosting');
    expect(constraintCatalog.getConstraintsByStyleId).toHaveBeenCalledWith('scandinavian');
    expect(clientBriefRepository.getById).toHaveBeenCalledWith('brief-warm-host-001');
  });

  it('applies the resolved client clearance multiplier to the hydrated minimum-clearance rule', async () => {
    const levelRepository = { loadLevel: vi.fn().mockResolvedValue(rawLevel) };
    const itemCatalog = { getItemsByIds: vi.fn().mockResolvedValue([item]) };
    const constraintCatalog = { getConstraintsByStyleId: vi.fn().mockResolvedValue([]) };
    const clientBriefRepository = {
      getById: vi.fn().mockResolvedValue({
        ...rawBrief,
        spatialPreferences: {
          ...rawBrief.spatialPreferences,
          clearanceMultiplier: 0.75
        }
      })
    };
    const useCase = new LoadLevelUseCase(levelRepository, itemCatalog, constraintCatalog, null, clientBriefRepository);

    const result = await useCase.execute('level-001');

    expect(result.success).toBe(true);
    expect(result.data.ergonomicsRules.minimumClearance.minimumDistance).toBe(0.9);
    expect(result.data.ergonomicsRules.minimumClearance.clientMultiplier).toBe(0.75);
    expect(result.data.ergonomicsRules.minimumClearance.effectiveMinimumDistance).toBeCloseTo(0.675, 5);
  });

  it('rejects absent or cross-level client policy instead of using level-side evaluation fallback', async () => {
    const levelRepository = { loadLevel: vi.fn().mockResolvedValue(rawLevel) };
    const itemCatalog = { getItemsByIds: vi.fn().mockResolvedValue([item]) };
    const missingRepository = { getById: vi.fn().mockResolvedValue(null) };
    const useCase = new LoadLevelUseCase(levelRepository, itemCatalog, null, null, missingRepository);

    await expect(useCase.execute('level-001')).resolves.toEqual({
      success: false,
      error: 'INVALID_LEVEL_DATA: Unknown client brief brief-warm-host-001'
    });

    const crossLevelRepository = { getById: vi.fn().mockResolvedValue({ ...rawBrief, levelId: 'level-002' }) };
    const crossLevelUseCase = new LoadLevelUseCase(levelRepository, itemCatalog, null, null, crossLevelRepository);
    await expect(crossLevelUseCase.execute('level-001')).resolves.toEqual({
      success: false,
      error: 'INVALID_LEVEL_DATA: Client brief brief-warm-host-001 belongs to level-002, not level-001'
    });
  });
});
