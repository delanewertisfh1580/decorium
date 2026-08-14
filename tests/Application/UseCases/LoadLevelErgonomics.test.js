import { describe, expect, it } from 'vitest';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import MinimumClearanceRule from '../../../src/Domain/Ergonomics/MinimumClearanceRule.js';
import PassageZone from '../../../src/Domain/Ergonomics/PassageZone.js';
import LoadLevelUseCase from '../../../src/Application/UseCases/LoadLevelUseCase.js';

const item = new Item({
  id: 'chair-001', name: 'Chair', type: 'seating', dimensions: { x: 1, z: 1 },
  featureVector: new FeatureVector({
    woodShare: 0.7, metalShare: 0.1, glassShare: 0.05, plasticShare: 0.05, textileShare: 0.1,
    lightColorShare: 0.7, darkColorShare: 0.3, warmPaletteShare: 0.6, saturationLevel: 0.3,
    formSimplicity: 0.8, roundnessShare: 0.2, rectilinearShare: 0.8, sizeNorm: 0.5,
    priceNorm: 0.5, lightingFunctionShare: 0, storageFunctionShare: 0
  })
});

const rawLevel = {
  id: 'level-001', name: 'Test level', styleId: 'scandinavian',
  roomDimensions: { width: 6, height: 3, depth: 5 },
  availableItems: ['chair-001'], initialPlacement: [],
  ergonomicsRules: {
    minimumClearance: { minimumDistance: 0.9, weight: 1.5 },
    passageZones: [{ id: 'entry', label: 'Вход', x: 0, z: 2, width: 1.2, depth: 2, weight: 1.4 }]
  }
};

describe('LoadLevelUseCase ergonomics rules', () => {
  it('hydrates the authored clearance rule as an immutable Domain object on LevelDTO', async () => {
    const useCase = new LoadLevelUseCase(
      { loadLevel: async () => rawLevel },
      { getItemsByIds: async () => [item] },
      { getConstraintsByStyleId: async () => [] }
    );

    const result = await useCase.execute('level-001');

    expect(result.success).toBe(true);
    expect(result.data.ergonomicsRules.minimumClearance).toBeInstanceOf(MinimumClearanceRule);
    expect(result.data.ergonomicsRules.minimumClearance.minimumDistance).toBe(0.9);
    expect(result.data.ergonomicsRules.minimumClearance.weight).toBe(1.5);
    expect(result.data.ergonomicsRules.passageZones[0]).toBeInstanceOf(PassageZone);
    expect(result.data.ergonomicsRules.passageZones[0].label).toBe('Вход');
  });
});
