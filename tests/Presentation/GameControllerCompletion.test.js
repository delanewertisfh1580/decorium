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
  const evaluateRoomUseCase = { execute: vi.fn(async () => ({ success: true, evaluationData })) };
  const controller = new GameController({
    loadLevelUseCase: {},
    placeItemUseCase: {},
    moveItemUseCase: {},
    rotateItemUseCase: {},
    removeItemUseCase: {},
    evaluateRoomUseCase,
    recordLevelCompletionUseCase,
    playerProfile: profile,
    roomRepository: {}
  });
  controller.level = {
    levelId: 'level-001',
    roomId: 'room-001',
    targetScore: 3,
    compositionRules: {},
    ergonomicsRules: {},
    clientBrief: { evaluationPolicy: { completion: { minimumStars: 3, criticalRuleMode: 'block-completion' } } }
  };
  controller.roomViewModel = { constraints: [] };
  controller.evaluationView = { render: vi.fn() };
  controller._renderDashboard = vi.fn();
  return { controller, evaluateRoomUseCase, recordLevelCompletionUseCase, profile };
}

describe('GameController completion integration', () => {
  it('forwards brief-owned completion policy and calibrated evaluation eligibility to the completion workflow', async () => {
    const updatedProfile = createProfile().recordLevelCompletion({
      levelId: 'level-001', stars: 3, updatedAt: '2026-08-14T10:05:00.000Z'
    });
    const { controller, evaluateRoomUseCase, recordLevelCompletionUseCase, profile } = createController({
      evaluationData: { score: 0.72, stars: 3, completionEligible: true, feedback: [], violations: [] },
      recordResult: { success: true, data: updatedProfile, didComplete: true }
    });

    await controller._onEvaluate();

    expect(evaluateRoomUseCase.execute).toHaveBeenCalledWith(
      'room-001',
      [],
      {},
      {},
      { minimumStars: 3, criticalRuleMode: 'block-completion' }
    );
    expect(recordLevelCompletionUseCase.execute).toHaveBeenCalledWith({
      levelId: 'level-001', stars: 3, targetScore: 3, completionEligible: true, profile
    });
    expect(controller.playerProfile).toBe(updatedProfile);
  });

  it('notifies a campaign refresh listener after a persisted level completion', async () => {
    const updatedProfile = createProfile().recordLevelCompletion({
      levelId: 'level-001', stars: 3, updatedAt: '2026-08-14T10:05:00.000Z'
    });
    const { controller } = createController({
      evaluationData: { score: 0.72, stars: 3, completionEligible: true, feedback: [], violations: [] },
      recordResult: { success: true, data: updatedProfile, didComplete: true }
    });
    const refreshCampaign = vi.fn(async () => {});
    controller.setCompletionProfileListener(refreshCampaign);

    await controller._onEvaluate();

    expect(refreshCampaign).toHaveBeenCalledWith(updatedProfile);
  });

  it('still delegates an unsuccessful calibrated attempt so the application layer, not UI, applies the completion policy', async () => {
    const profile = createProfile();
    const { controller, recordLevelCompletionUseCase } = createController({
      profile,
      evaluationData: { score: 0.45, stars: 2, completionEligible: false, feedback: [], violations: [] },
      recordResult: { success: true, data: profile, didComplete: false }
    });

    await controller._onEvaluate();

    expect(recordLevelCompletionUseCase.execute).toHaveBeenCalledWith({
      levelId: 'level-001', stars: 2, targetScore: 3, completionEligible: false, profile
    });
  });
});
