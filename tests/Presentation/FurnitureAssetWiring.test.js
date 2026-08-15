import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const controllerSource = readFileSync('src/Presentation/Controllers/GameController.js', 'utf8');
const roomViewSource = readFileSync('src/Presentation/Views/RoomView.js', 'utf8');

describe('PROD-012R furniture asset presentation wiring', () => {
  it('injects the presentation-only repository through GameController into RoomView and asynchronously upgrades visible item fallback geometry', () => {
    expect(controllerSource).toContain('furnitureAssetRepository = null');
    expect(controllerSource).toContain('new RoomView(canvas, { furnitureAssetRepository: this.furnitureAssetRepository })');
    expect(roomViewSource).toContain('furnitureAssetRepository = null');
    expect(roomViewSource).toContain('this.furnitureAssetRepository.createForItemId(item.id)');
    expect(roomViewSource).toContain('ItemVisualFactory.attachAsset(object, asset)');
  });
});
