import { describe, expect, it } from 'vitest';
import PlayerProfile from '../../../src/Domain/Profile/PlayerProfile.js';
import SavePlayerProfileUseCase from '../../../src/Application/UseCases/SavePlayerProfileUseCase.js';

const profile = PlayerProfile.create({
  profileId: 'profile-001',
  timestamp: '2026-08-14T10:00:00.000Z'
});

describe('SavePlayerProfileUseCase', () => {
  it('persists a valid domain profile through the repository port', async () => {
    const saved = [];
    const useCase = new SavePlayerProfileUseCase({
      save: async value => {
        saved.push(value);
        return true;
      }
    });

    const result = await useCase.execute(profile);

    expect(result).toEqual({ success: true, data: profile });
    expect(saved).toEqual([profile]);
  });

  it('rejects non-domain values before calling Infrastructure', async () => {
    const save = async () => true;
    const useCase = new SavePlayerProfileUseCase({ save });

    const result = await useCase.execute({});

    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_PROFILE');
  });

  it('returns a persistence error when Infrastructure declines a save', async () => {
    const useCase = new SavePlayerProfileUseCase({ save: async () => false });

    const result = await useCase.execute(profile);

    expect(result.success).toBe(false);
    expect(result.error).toContain('PERSISTENCE_ERROR');
  });
});
