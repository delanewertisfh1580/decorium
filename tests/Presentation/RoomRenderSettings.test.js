import { describe, expect, it, vi } from 'vitest';
import { GameController } from '../../src/Presentation/Controllers/GameController.js';
import { rendererSettingsFor } from '../../src/Presentation/Views/RoomView.js';

describe('Room render settings', () => {
  it('maps persisted quality tiers to deterministic renderer-safe settings', () => {
    expect(rendererSettingsFor('balanced')).toEqual({ pixelRatioCap: 2, shadowsEnabled: true });
    expect(rendererSettingsFor('performance')).toEqual({ pixelRatioCap: 1, shadowsEnabled: false });
  });

  it('forwards player settings from controller to room view after construction', () => {
    const controller = new GameController({
      loadLevelUseCase: {}, placeItemUseCase: {}, moveItemUseCase: {}, rotateItemUseCase: {},
      removeItemUseCase: {}, evaluateRoomUseCase: {}, roomRepository: {}
    });
    controller.roomView = { setRenderSettings: vi.fn() };
    const settings = { reducedMotion: true, uiScale: 'large', qualityTier: 'performance' };

    controller.setPlayerSettings(settings);

    expect(controller.roomView.setRenderSettings).toHaveBeenCalledWith(settings);
    expect(controller.playerSettings).toEqual(settings);
  });
});
