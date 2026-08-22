import RoomInteriorGenerator from '../../Domain/Rooms/RoomInteriorGenerator.js';

function saveState(repository, roomId, state) {
  return repository.saveState ? repository.saveState(roomId, state) : repository.saveRoomState(roomId, state);
}

export class GenerateRoomInteriorUseCase {
  constructor(roomRepository, generator = new RoomInteriorGenerator()) {
    if (!roomRepository) throw new Error('GenerateRoomInteriorUseCase: roomRepository is required.');
    if (!(generator instanceof RoomInteriorGenerator)) throw new Error('GenerateRoomInteriorUseCase: generator must be a RoomInteriorGenerator.');
    this.roomRepository = roomRepository;
    this.generator = generator;
  }

  async execute({ roomId, recipe, seed, bounds, itemsById, surfaceDefaults, allowedItemIds = null, unlockedIds = null }) {
    if (typeof roomId !== 'string' || roomId.trim() === '') return Object.freeze({ success: false, error: 'INVALID_ROOM_ID' });
    try {
      const generated = this.generator.generate({ recipe, seed, bounds, itemsById, surfaceDefaults, allowedItemIds, unlockedIds });
      if (!generated.success) return generated;
      if (!await saveState(this.roomRepository, roomId, generated.data.roomState)) {
        return Object.freeze({ success: false, error: 'PERSISTENCE_ERROR' });
      }
      return generated;
    } catch (error) {
      console.error(`GenerateRoomInteriorUseCase: Error generating ${roomId}:`, error);
      return Object.freeze({ success: false, error: `UNEXPECTED_ERROR: ${error.message}` });
    }
  }
}

export default GenerateRoomInteriorUseCase;
