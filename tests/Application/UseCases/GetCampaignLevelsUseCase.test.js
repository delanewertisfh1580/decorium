import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../../src/Domain/Profile/PlayerProfile.js';
import ProgressionPolicy from '../../../src/Domain/Progression/ProgressionPolicy.js';
import GetCampaignLevelsUseCase from '../../../src/Application/UseCases/GetCampaignLevelsUseCase.js';

const levels = [
  { id: 'level-001', name: 'Первый', description: 'Первый', sortOrder: 1 },
  { id: 'level-002', name: 'Второй', description: 'Второй', sortOrder: 2, prerequisiteLevelId: 'level-001' }
];
const timestamp = '2026-08-14T11:00:00.000Z';

describe('GetCampaignLevelsUseCase', () => {
  it('returns deterministic authored summaries enriched with progression availability', async () => {
    const useCase = new GetCampaignLevelsUseCase(
      { listLevels: async () => [...levels].reverse() },
      new ProgressionPolicy()
    );
    const profile = PlayerProfile.create({ profileId: 'profile-001', timestamp });

    const result = await useCase.execute(profile);

    expect(result).toEqual({
      success: true,
      data: [
        {
          id: 'level-001', name: 'Первый', description: 'Первый', sortOrder: 1,
          prerequisiteLevelId: null, isUnlocked: true, bestStars: null
        },
        {
          id: 'level-002', name: 'Второй', description: 'Второй', sortOrder: 2,
          prerequisiteLevelId: 'level-001', isUnlocked: false, bestStars: null
        }
      ]
    });
  });

  it('surfaces repository errors as a stable application failure', async () => {
    const useCase = new GetCampaignLevelsUseCase(
      { listLevels: async () => { throw new Error('manifest unavailable'); } },
      new ProgressionPolicy()
    );

    await expect(useCase.execute(PlayerProfile.create({ profileId: 'profile-001', timestamp }))).resolves.toEqual({
      success: false,
      error: 'UNEXPECTED_ERROR: manifest unavailable'
    });
  });
});
