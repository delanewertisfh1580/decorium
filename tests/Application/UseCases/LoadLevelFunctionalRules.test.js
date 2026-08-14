import { describe, expect, it } from 'vitest';
import { LoadLevelUseCase } from '../../../src/Application/UseCases/LoadLevelUseCase.js';
import FunctionalLayoutRule from '../../../src/Domain/Ergonomics/FunctionalLayoutRule.js';

describe('LoadLevelUseCase functional layout rules', () => {
  it('hydrates authored functionalLayoutRules into immutable Domain rules in LevelDTO', async () => {
    const levelRepository = {
      loadLevel: async () => ({
        id: 'functional-room',
        roomId: 'functional-room',
        name: 'Functional room',
        roomDimensions: { width: 5, depth: 5 },
        items: [],
        constraints: [],
        ergonomicsRules: {
          functionalLayoutRules: [{
            schemaVersion: 1,
            id: 'dining-seating',
            kind: 'adjacency',
            anchorSelector: { affordance: 'dining-surface' },
            partnerSelector: { affordance: 'dining-seat' },
            minPartners: 2,
            distance: { min: 0.05, max: 0.35 },
            weight: 1.2,
            messageKey: 'functional-dining-seat-required'
          }]
        }
      })
    };

    const result = await new LoadLevelUseCase(levelRepository).execute('functional-room');

    expect(result.success).toBe(true);
    expect(result.data.ergonomicsRules.functionalLayoutRules).toHaveLength(1);
    expect(result.data.ergonomicsRules.functionalLayoutRules[0]).toBeInstanceOf(FunctionalLayoutRule);
    expect(result.data.ergonomicsRules.functionalLayoutRules[0].minPartners).toBe(2);
    expect(Object.isFrozen(result.data.ergonomicsRules.functionalLayoutRules)).toBe(true);
  });
});
