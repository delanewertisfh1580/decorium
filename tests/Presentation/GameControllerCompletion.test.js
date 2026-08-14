import { describe, expect, it, vi } from 'vitest';
import PlayerProfile from '../../src/Domain/Profile/PlayerProfile.js';
import { GameController } from '../../src/Presentation/Controllers/GameController.js';

function createProfile() {
  return PlayerProfile.create({
    profileId: 'profile-001',
    timestamp: '2026-08-14T10:00:00.000Z'
  });
}

function createController({ evaluationData, recordResult, profile = createProfile() }) {
  const recordLevelCompletionUseCase = { execute: vi.fn(async () => recordResult) };
  const controller = new GameController({
    loadLevelUseCase: {},
    placeItemUseCase: {},
    moveItemUseCase: {},
    rotateItemUseCase: {},
    removeItemUseCase: {},
    evaluateRoomUseCase: { execute: vi.fn(async () => ({ success: true, evaluationData })) },
    recordLevelCompletionUseCase,
    playerProfile: profile,
    roomRepository: {}
  });
  controller.level = {
    levelId: 'level-001', roomId: 'room-001', targetScore: 3,
    compositionRules: {}, ergonomicsRules: {}
  };
  controller.roomViewModel = { constraints: [] };
  controller.evaluationView = { render: vi.fn() };
  controller._renderDashboard = vi.fn();
  return { controller, recordLevelCompletionUseCase, profile };
}

describe('GameController completion integration', () => {
  it('delegates successful authored evaluation facts to completion workflow and keeps the saved profile', async () => {
    const updatedProfile = createProfile().recordLevelCompletion({
      levelId: 'level-001', stars: 3, updatedAt: '2026-08-14T10:05:00.000Z'
    });
    const { controller, recordLevelCompletionUseCase, profile } = createController({
      evaluationData: { score: 0.72, stars: 3, feedback: [], violations: [] },
      recordResult: { success: true, data: updatedProfile, didComplete: true }
    });

    await controller._onEvaluate();

    expect(recordLevelCompletionUseCase.execute).toHaveBeenCalledWith({
      levelId: 'level-001', stars: 3, targetScore: 3, profile
    });
    expect(controller.playerProfile).toBe(updatedProfile);
  });

  it('still delegates an unsuccessful attempt so the application layer, not UI, applies the target policy', async () => {
    const profile = createProfile();
    const { controller, recordLevelCompletionUseCase } = createController({
      profile,
      evaluationData: { score: 0.45, stars: 2, feedback: [], violations: [] },
      recordResult: { success: true, data: profile, didComplete: false }
    });

    await controller._onEvaluate();

    expect(recordLevelCompletionUseCase.execute).toHaveBeenCalledWith({
      levelId: 'level-001', stars: 2, targetScore: 3, profile
    });
  });
});
