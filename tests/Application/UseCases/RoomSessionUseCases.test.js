import { describe, expect, it, vi } from 'vitest';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import StartLevelSessionUseCase from '../../../src/Application/UseCases/StartLevelSessionUseCase.js';
import ReadRoomStateUseCase from '../../../src/Application/UseCases/ReadRoomStateUseCase.js';
import ResetRoomAttemptUseCase from '../../../src/Application/UseCases/ResetRoomAttemptUseCase.js';

const item = { id: 'chair-001', dimensions: { x: 0.5, z: 0.5 }, featureVector: {} };

describe('room session application use cases', () => {
  it('starts a level session by persisting the loaded initial room state', async () => {
    const roomState = RoomState.createEmpty(new RoomBounds(6, 5));
    const loaded = { success: true, data: { roomId: 'room-001', roomState } };
    const loadLevelUseCase = { execute: vi.fn(async () => loaded) };
    const roomRepository = { saveState: vi.fn(async () => true) };
    const useCase = new StartLevelSessionUseCase(loadLevelUseCase, roomRepository);

    const result = await useCase.execute('level-001');

    expect(result).toBe(loaded);
    expect(loadLevelUseCase.execute).toHaveBeenCalledWith('level-001');
    expect(roomRepository.saveState).toHaveBeenCalledWith('room-001', roomState);
  });

  it('does not persist a failed level load', async () => {
    const loadLevelUseCase = { execute: vi.fn(async () => ({ success: false, error: 'UNKNOWN_LEVEL' })) };
    const roomRepository = { saveState: vi.fn() };
    const useCase = new StartLevelSessionUseCase(loadLevelUseCase, roomRepository);

    await expect(useCase.execute('missing')).resolves.toEqual({ success: false, error: 'UNKNOWN_LEVEL' });
    expect(roomRepository.saveState).not.toHaveBeenCalled();
  });

  it('reads persisted room state through an immutable result DTO', async () => {
    const roomState = RoomState.createEmpty(new RoomBounds(6, 5));
    const roomRepository = { getState: vi.fn(async () => roomState) };
    const useCase = new ReadRoomStateUseCase(roomRepository);

    const result = await useCase.execute('room-001');

    expect(result).toMatchObject({ success: true, roomState, error: null });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('reports a missing persisted room state instead of leaking repository null to presentation', async () => {
    const useCase = new ReadRoomStateUseCase({ getState: vi.fn(async () => null) });

    await expect(useCase.execute('room-404')).resolves.toMatchObject({
      success: false,
      error: 'ROOM_NOT_FOUND: Room room-404 not found.'
    });
  });

  it('resets an attempt to an empty state with the exact existing room bounds', async () => {
    const bounds = new RoomBounds(6, 5);
    const previousState = RoomState.createEmpty(bounds);
    previousState.placeItem(item, { x: 1, y: 0, z: 1 });
    const roomRepository = {
      getState: vi.fn(async () => previousState),
      saveState: vi.fn(async () => true)
    };
    const useCase = new ResetRoomAttemptUseCase(roomRepository);

    const result = await useCase.execute('room-001');

    expect(result.success).toBe(true);
    expect(result.roomState).not.toBe(previousState);
    expect(result.roomState.bounds).toBe(bounds);
    expect(result.roomState.getItemCount()).toBe(0);
    expect(roomRepository.saveState).toHaveBeenCalledWith('room-001', result.roomState);
  });

  it('returns a structured persistence failure while resetting a room attempt', async () => {
    const state = RoomState.createEmpty(new RoomBounds(6, 5));
    const useCase = new ResetRoomAttemptUseCase({
      getState: vi.fn(async () => state),
      saveState: vi.fn(async () => false)
    });

    await expect(useCase.execute('room-001')).resolves.toMatchObject({
      success: false,
      error: 'PERSISTENCE_ERROR: Failed to reset room state.'
    });
  });
});
