import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = relativePath => readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('no hidden room composition asset wiring', () => {
  it('removes the room GLB composition pipeline from bootstrap and all scene ownership layers', () => {
    const sources = [
      'src/main.js',
      'src/Presentation/Controllers/GameController.js',
      'src/Presentation/Views/RoomView.js',
      'src/Presentation/Scene/SceneLifeSystem.js',
      'src/Presentation/Scene/LocationEnvironmentSystem.js'
    ].map(readSource);
    for (const source of sources) {
      expect(source).not.toContain('RoomCompositionAssetRepository');
      expect(source).not.toContain('roomCompositionAssetRepository');
      expect(source).not.toContain('roomCompositionPbrAssetManifest');
    }
  });

  it('keeps runtime scoring independent of all presentation assets', () => {
    expect(readSource('src/Domain/Scoring/StyleScorer.js')).not.toContain('RoomCompositionAssetRepository');
    expect(readSource('src/Application/UseCases/EvaluateRoomUseCase.js')).not.toContain('RoomCompositionAssetRepository');
  });
});
