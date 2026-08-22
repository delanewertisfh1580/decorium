import { RoomViewModel } from '../ViewModels/RoomViewModel.js';

export class LevelSessionCoordinator {
  constructor({
    startLevelSessionUseCase = null,
    startEndlessSessionUseCase = null,
    readRoomStateUseCase = null,
    resetRoomAttemptUseCase = null,
    getRoomView = () => null
  } = {}) {
    this.startLevelSessionUseCase = startLevelSessionUseCase;
    this.startEndlessSessionUseCase = startEndlessSessionUseCase;
    this.readRoomStateUseCase = readRoomStateUseCase;
    this.resetRoomAttemptUseCase = resetRoomAttemptUseCase;
    this.getRoomView = getRoomView;
    this.level = null;
    this.roomViewModel = null;
  }

  getContext() {
    if (!this.level || !this.roomViewModel) return null;
    return Object.freeze({ level: this.level, roomViewModel: this.roomViewModel });
  }

  async load(levelId) {
    if (!this.startLevelSessionUseCase?.execute) {
      throw new Error('LEVEL_SESSION_UNAVAILABLE: StartLevelSessionUseCase is required.');
    }
    const result = await this.startLevelSessionUseCase.execute(levelId);
    if (!result.success) throw new Error(result.error);
    this.level = result.data;
    this.getRoomView()?.setPresentationEnvironment(this.level.presentationEnvironment);
    this.getRoomView()?.setSurfaceFinishes(this.level.surfaceFinishes);
    this.roomViewModel = new RoomViewModel(this.level);
    return this.getContext();
  }

  async loadEndless(seed) {
    if (!this.startEndlessSessionUseCase?.execute) {
      throw new Error('ENDLESS_SESSION_UNAVAILABLE: StartEndlessSessionUseCase is required.');
    }
    const result = await this.startEndlessSessionUseCase.execute({ seed });
    if (!result.success) throw new Error(result.error);
    this.level = result.data;
    this.getRoomView()?.setPresentationEnvironment(this.level.presentationEnvironment);
    this.getRoomView()?.setSurfaceFinishes(this.level.surfaceFinishes);
    this.roomViewModel = new RoomViewModel(this.level);
    return this.getContext();
  }

  async refreshRoomState() {
    if (!this.level || !this.readRoomStateUseCase?.execute) return null;
    const result = await this.readRoomStateUseCase.execute(this.level.roomId);
    if (result.success) this.level.roomState = result.roomState;
    return result;
  }

  async resetAttempt() {
    if (!this.level || !this.resetRoomAttemptUseCase?.execute) {
      return { success: false, error: 'LEVEL_SESSION_UNAVAILABLE: ResetRoomAttemptUseCase is required.' };
    }
    const result = await this.resetRoomAttemptUseCase.execute(this.level.roomId);
    if (!result.success) return result;
    this.level.roomState = result.roomState;
    this.roomViewModel = new RoomViewModel(this.level);
    return result;
  }

  setCompatibilityContext({ level = this.level, roomViewModel = this.roomViewModel } = {}) {
    this.level = level ?? null;
    this.roomViewModel = roomViewModel ?? null;
  }
}

export default LevelSessionCoordinator;
