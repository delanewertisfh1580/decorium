import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const controllerSource = readFileSync('src/Presentation/Controllers/GameController.js', 'utf8');
const sessionSource = readFileSync('src/Presentation/Controllers/LevelSessionCoordinator.js', 'utf8');
const interactionSource = readFileSync('src/Presentation/Controllers/RoomInteractionCoordinator.js', 'utf8');
const evaluationSource = readFileSync('src/Presentation/Controllers/EvaluationCoordinator.js', 'utf8');
const mainSource = readFileSync('src/main.js', 'utf8');

describe('GameController façade architecture', () => {
  it('composes dedicated coordinators rather than retaining room repository or domain-state ownership', () => {
    expect(controllerSource).toContain('new LevelSessionCoordinator({');
    expect(controllerSource).toContain('new RoomInteractionCoordinator({');
    expect(controllerSource).toContain('new EvaluationCoordinator({');
    expect(controllerSource).not.toContain('roomRepository');
    expect(controllerSource).not.toContain("from '../../Domain/Rooms/RoomState.js'");
    expect(controllerSource).not.toContain('RoomState.createEmpty');
    expect(controllerSource).not.toContain('document.getElementById');
  });

  it('keeps session persistence in Application use cases and room mutations in the interaction coordinator', () => {
    expect(sessionSource).toContain('startLevelSessionUseCase.execute(levelId)');
    expect(sessionSource).toContain('readRoomStateUseCase.execute(this.level.roomId)');
    expect(sessionSource).toContain('resetRoomAttemptUseCase.execute(this.level.roomId)');
    expect(interactionSource).toContain('placeItemUseCase.execute(');
    expect(interactionSource).toContain('moveItemUseCase.execute(');
    expect(interactionSource).toContain('rotateItemUseCase.execute(');
    expect(interactionSource).toContain('removeItemUseCase.execute(');
    expect(interactionSource).toContain('this.undoBuffer = new UndoBuffer();');
  });

  it('keeps evaluation, completion and authored evaluation inputs behind EvaluationCoordinator', () => {
    expect(evaluationSource).toContain('this.evaluateRoomUseCase.execute(');
    expect(evaluationSource).toContain('this.recordLevelCompletionUseCase.execute({');
    expect(evaluationSource).toContain('evaluationSpec: level.evaluationSpec');
    expect(controllerSource).not.toContain('this.evaluateRoomUseCase.execute(');
  });

  it('constructs all room-session application boundaries in the composition root', () => {
    expect(mainSource).toContain('new StartLevelSessionUseCase(loadLevelUseCase, roomRepository)');
    expect(mainSource).toContain('new ReadRoomStateUseCase(roomRepository)');
    expect(mainSource).toContain('new ResetRoomAttemptUseCase(roomRepository)');
  });
});
