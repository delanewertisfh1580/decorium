import { describe, expect, it, vi } from 'vitest';
import { RoomBounds } from '../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../src/Domain/Rooms/RoomState.js';
import { LevelSessionCoordinator } from '../../src/Presentation/Controllers/LevelSessionCoordinator.js';

function createLevel(roomState = RoomState.createEmpty(new RoomBounds(6, 5))) {
  return {
    levelId: 'level-001',
    roomId: 'room-001',
    name: 'Гостиная',
    roomState,
    availableItems: [],
    constraints: [],
    presentationEnvironment: { id: 'warm-starter-living' }
  };
}

describe('LevelSessionCoordinator', () => {
  it('starts a session, applies the authored environment and creates a fresh RoomViewModel', async () => {
    const level = createLevel();
    const roomView = { setPresentationEnvironment: vi.fn() };
    const startLevelSessionUseCase = { execute: vi.fn(async () => ({ success: true, data: level })) };
    const coordinator = new LevelSessionCoordinator({
      startLevelSessionUseCase,
      getRoomView: () => roomView
    });

    const context = await coordinator.load('level-001');

    expect(startLevelSessionUseCase.execute).toHaveBeenCalledWith('level-001');
    expect(roomView.setPresentationEnvironment).toHaveBeenCalledWith(level.presentationEnvironment);
    expect(context.level).toBe(level);
    expect(context.roomViewModel.roomState).toBe(level.roomState);
    expect(Object.isFrozen(context)).toBe(true);
  });

  it('refreshes the active level room state only from the read use case result', async () => {
    const level = createLevel();
    const refreshedState = RoomState.createEmpty(level.roomState.bounds);
    const readRoomStateUseCase = { execute: vi.fn(async () => ({ success: true, roomState: refreshedState })) };
    const coordinator = new LevelSessionCoordinator({ readRoomStateUseCase });
    coordinator.setCompatibilityContext({ level, roomViewModel: { roomState: level.roomState } });

    const result = await coordinator.refreshRoomState();

    expect(readRoomStateUseCase.execute).toHaveBeenCalledWith('room-001');
    expect(result.success).toBe(true);
    expect(level.roomState).toBe(refreshedState);
  });

  it('resets an active attempt through the reset use case and renews its RoomViewModel', async () => {
    const level = createLevel();
    const resetState = RoomState.createEmpty(level.roomState.bounds);
    const resetRoomAttemptUseCase = { execute: vi.fn(async () => ({ success: true, roomState: resetState })) };
    const coordinator = new LevelSessionCoordinator({ resetRoomAttemptUseCase });
    coordinator.setCompatibilityContext({ level, roomViewModel: { roomState: level.roomState } });

    const result = await coordinator.resetAttempt();

    expect(resetRoomAttemptUseCase.execute).toHaveBeenCalledWith('room-001');
    expect(result.success).toBe(true);
    expect(coordinator.level.roomState).toBe(resetState);
    expect(coordinator.roomViewModel.roomState).toBe(resetState);
  });

  it('returns structured failure when reset is requested before a session is active', async () => {
    const coordinator = new LevelSessionCoordinator({
      resetRoomAttemptUseCase: { execute: vi.fn() }
    });

    await expect(coordinator.resetAttempt()).resolves.toMatchObject({
      success: false,
      error: 'LEVEL_SESSION_UNAVAILABLE: ResetRoomAttemptUseCase is required.'
    });
  });
});
