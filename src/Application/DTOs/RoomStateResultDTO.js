export default class RoomStateResultDTO {
  constructor(success, roomState = null, error = null) {
    this.success = success;
    this.roomState = roomState;
    this.error = error;
    Object.freeze(this);
  }

  static success(roomState) {
    return new RoomStateResultDTO(true, roomState, null);
  }

  static failure(error) {
    return new RoomStateResultDTO(false, null, error);
  }
}
