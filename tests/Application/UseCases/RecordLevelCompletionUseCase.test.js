import { describe, expect, it, vi } from 'vitest';
import PlayerProfile from '../../../src/Domain/Profile/PlayerProfile.js';
import RecordLevelCompletionUseCase from '../../../src/Application/UseCases/RecordLevelCompletionUseCase.js';

function createProfile() {
  return PlayerProfile.create({
    profileId: 'profile-001',
    timestamp: '2026-08-14T10:00:00.000Z'
  });
}

describe('RecordLevelCompletionUseCase', () => {
  it('records and persists an improved completion when the evaluation reaches the authored target', async () => {
    const savePlayerProfileUseCase = { execute: vi.fn(async profile => ({ success: true, data: profile })) };
    const useCase = new RecordLevelCompletionUseCase(
      savePlayerProfileUseCase,
      () => '2026-08-14T10:05:00.000Z'
    );

    const result = await useCase.execute({
      levelId: 'level-001',
      stars: 3,
      targetScore: 3,
      profile: createProfile()
    });

    expect(savePlayerProfileUseCase.execute).toHaveBeenCalledTimes(1);
    expect(savePlayerProfileUseCase.execute.mock.calls[0][0].progress.completedLevels['level-001']).toEqual({
      bestStars: 3,
      completedAt: '2026-08-14T10:05:00.000Z'
    });
    expect(result).toMatchObject({ success: true, didComplete: true });
  });

  it('does not persist a completion when a scorecard critical-rule gate explicitly denies eligibility', async () => {
    const savePlayerProfileUseCase = { execute: vi.fn() };
    const profile = createProfile();
    const useCase = new RecordLevelCompletionUseCase(
      savePlayerProfileUseCase,
      () => '2026-08-14T10:05:00.000Z'
    );

    const result = await useCase.execute({
      levelId: 'level-001',
      stars: 5,
      targetScore: 3,
      completionEligible: false,
      profile
    });

    expect(savePlayerProfileUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: profile, didComplete: false });
  });

  it('does not persist a completion below the authored target', async () => {
    const savePlayerProfileUseCase = { execute: vi.fn() };
    const profile = createProfile();
    const useCase = new RecordLevelCompletionUseCase(
      savePlayerProfileUseCase,
      () => '2026-08-14T10:05:00.000Z'
    );

    const result = await useCase.execute({
      levelId: 'level-001',
      stars: 2,
      targetScore: 3,
      profile
    });

    expect(savePlayerProfileUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: profile, didComplete: false });
  });
});
