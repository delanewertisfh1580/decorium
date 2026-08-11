export class InMemoryRoomRepository {
  constructor(initialStates = new Map()) {
    this.states = initialStates;
  }

  async getState(roomId) {
    return this.states.get(roomId) ?? null;
  }

  async saveState(roomId, roomState) {
    this.states.set(roomId, roomState);
    return true;
  }

  async loadRoomState(roomId) {
    return this.getState(roomId);
  }

  async saveRoomState(roomId, roomState) {
    return this.saveState(roomId, roomState);
  }
}

export default InMemoryRoomRepository;
