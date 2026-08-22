import { describe, expect, it, vi } from 'vitest';
import { EvaluationCoordinator } from '../../src/Presentation/Controllers/EvaluationCoordinator.js';

function createContext() {
  const roomState = {
    getItem: vi.fn(id => id === 'chair-001' ? { id, item: { name: 'Кресло' } } : null)
  };
  return {
    level: {
      levelId: 'level-001',
      roomId: 'room-001',
      targetScore: 3,
      compositionRules: { gridSize: 0.5 },
      ergonomicsRules: { clearance: [] },
      clientBrief: { evaluationPolicy: { completion: { minimumStars: 3 } } },
      evaluationSpec: { schemaVersion: 1 }
    },
    roomViewModel: { constraints: ['style-rule'], roomState },
    profile: { profileId: 'profile-001' }
  };
}

function createCoordinator({ evaluationResult, completionResult } = {}) {
  const evaluationView = { render: vi.fn(), hide: vi.fn() };
  const evaluateRoomUseCase = {
    execute: vi.fn(async () => evaluationResult ?? {
      success: true,
      evaluationData: { score: 0.82, stars: 4, completionEligible: true, feedback: [], violations: [] }
    })
  };
  const recordLevelCompletionUseCase = {
    execute: vi.fn(async () => completionResult ?? {
      success: true,
      data: { profileId: 'profile-001', completed: true },
      didComplete: true
    })
  };
  const ports = {
    onProfileUpdated: vi.fn(),
    onCompleted: vi.fn(async () => {}),
    onStatus: vi.fn(),
    onRequestDashboardRender: vi.fn(),
    onRequestRoomRender: vi.fn(),
    onFocusItem: vi.fn()
  };
  const coordinator = new EvaluationCoordinator({
    evaluateRoomUseCase,
    recordLevelCompletionUseCase,
    getEvaluationView: () => evaluationView,
    ...ports
  });
  return { coordinator, evaluationView, evaluateRoomUseCase, recordLevelCompletionUseCase, ports };
}

describe('EvaluationCoordinator', () => {
  it('forwards the existing evaluation and calibrated completion payloads without UI policy inference', async () => {
    const { level, roomViewModel, profile } = createContext();
    const { coordinator, evaluationView, evaluateRoomUseCase, recordLevelCompletionUseCase, ports } = createCoordinator();

    await coordinator.evaluate({ level, roomViewModel, profile });

    expect(evaluateRoomUseCase.execute).toHaveBeenCalledWith({
      roomId: 'room-001',
      evaluationSpec: { schemaVersion: 1 }
    });
    expect(recordLevelCompletionUseCase.execute).toHaveBeenCalledWith({
      levelId: 'level-001',
      stars: 4,
      targetScore: 3,
      completionEligible: true,
      profile
    });
    expect(evaluationView.render).toHaveBeenCalledWith(expect.objectContaining({ score: 0.82, stars: 4 }));
    expect(ports.onProfileUpdated).toHaveBeenCalledWith({ profileId: 'profile-001', completed: true });
    expect(ports.onCompleted).toHaveBeenCalledWith({ profileId: 'profile-001', completed: true });
    expect(ports.onRequestDashboardRender).toHaveBeenCalledTimes(1);
  });

  it('does not invoke completion or render a result when evaluation fails', async () => {
    const { level, roomViewModel, profile } = createContext();
    const { coordinator, evaluationView, recordLevelCompletionUseCase, ports } = createCoordinator({
      evaluationResult: { success: false, error: 'ROOM_NOT_FOUND' }
    });

    await coordinator.evaluate({ level, roomViewModel, profile });

    expect(recordLevelCompletionUseCase.execute).not.toHaveBeenCalled();
    expect(evaluationView.render).not.toHaveBeenCalled();
    expect(ports.onStatus).toHaveBeenCalledWith('ROOM_NOT_FOUND');
  });

  it('keeps evaluation visible when explainability focus selects an existing item', async () => {
    const { level, roomViewModel, profile } = createContext();
    const { coordinator, evaluationView, ports } = createCoordinator();
    await coordinator.evaluate({ level, roomViewModel, profile });

    const focused = coordinator.focusExplanation('chair-001', { roomViewModel });

    expect(focused).toBe(true);
    expect(ports.onFocusItem).toHaveBeenCalledWith('chair-001', expect.objectContaining({ id: 'chair-001' }));
    expect(ports.onRequestRoomRender).toHaveBeenCalledTimes(1);
    expect(evaluationView.hide).not.toHaveBeenCalled();
    expect(coordinator.viewModel.isVisible).toBe(true);
  });

  it('invalidates a previous evaluation only once and hides the supplied view', async () => {
    const { level, roomViewModel, profile } = createContext();
    const { coordinator, evaluationView, ports } = createCoordinator();
    await coordinator.evaluate({ level, roomViewModel, profile });

    expect(coordinator.invalidate()).toBe(true);
    expect(coordinator.invalidate()).toBe(false);
    expect(evaluationView.hide).toHaveBeenCalledTimes(1);
    expect(ports.onRequestDashboardRender).toHaveBeenCalledTimes(2);
  });
});
