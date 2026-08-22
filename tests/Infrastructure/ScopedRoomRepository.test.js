import { describe, expect, it, vi } from 'vitest';
import ScopedRoomRepository from '../../src/Infrastructure/Repositories/ScopedRoomRepository.js';
import { RoomBounds } from '../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../src/Domain/Rooms/RoomState.js';

function memorySessionRepository() {
  const states = new Map();
  return {
    async getState(roomId) { return states.get(roomId) ?? null; },
    async saveState(roomId, roomState) { states.set(roomId, roomState); return true; }
  };
}

describe('ScopedRoomRepository endless scope', () => {
  it('keeps an ephemeral generated baseline for reset without writing any durable profile-level design snapshot', async () => {
    const durableDesigns = { save: vi.fn(async () => true) };
    const repository = new ScopedRoomRepository({ sessionRepository: memorySessionRepository(), roomDesignRepository: durableDesigns });
    const baseline = RoomState.createEmpty(new RoomBounds(6, 5));

    repository.registerEphemeral('endless-room-77', baseline);
    await repository.saveState('endless-room-77', baseline);

    const restoredBaseline = repository.getBaselineState('endless-room-77');
    expect(restoredBaseline).not.toBe(baseline);
    expect(restoredBaseline.bounds).toBe(baseline.bounds);
    expect(durableDesigns.save).not.toHaveBeenCalled();
  });
});
