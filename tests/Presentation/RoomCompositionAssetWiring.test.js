import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const readSource = relativePath => readFileSync(resolve(ROOT, relativePath), 'utf8');

describe('PROD-017 room composition asset wiring', () => {
  it('keeps the versioned room GLB pack in Presentation composition and passes it through controller/view/life layers without entering gameplay rules', () => {
    const main = readSource('src/main.js');
    const controller = readSource('src/Presentation/Controllers/GameController.js');
    const roomView = readSource('src/Presentation/Views/RoomView.js');
    const sceneLife = readSource('src/Presentation/Scene/SceneLifeSystem.js');
    const locationEnvironment = readSource('src/Presentation/Scene/LocationEnvironmentSystem.js');

    expect(main).toContain("import RoomCompositionAssetRepository from './Presentation/Scene/RoomCompositionAssetRepository.js';");
    expect(main).toContain("import roomCompositionPbrAssetManifest from '../data/visuals/room-composition-pbr-assets.v1.json';");
    expect(main).toContain('new RoomCompositionAssetRepository({ manifest: roomCompositionPbrAssetManifest })');
    expect(main).toContain('roomCompositionAssetRepository');
    expect(controller).toContain('roomCompositionAssetRepository = null');
    expect(controller).toContain('roomCompositionAssetRepository: this.roomCompositionAssetRepository');
    expect(roomView).toContain('roomCompositionAssetRepository = null');
    expect(roomView).toContain('roomCompositionAssetRepository: this.roomCompositionAssetRepository');
    expect(sceneLife).toContain('roomCompositionAssetRepository');
    expect(locationEnvironment).toContain('roomCompositionAssetRepository');
    expect(locationEnvironment).toContain('createForEnvironmentProfile(this.environmentPlan.id)');
    expect(locationEnvironment).toContain('this.compositionFallbackRoot.visible = false');
    expect(locationEnvironment).toContain("this.root.userData.compositionAssetState = 'fallback'");

    // Contract is source-scoped: no room GLB repository import belongs in gameplay layers.
    expect(readSource('src/Domain/Scoring/StyleScorer.js')).not.toContain('RoomCompositionAssetRepository');
    expect(readSource('src/Application/UseCases/EvaluateRoomUseCase.js')).not.toContain('RoomCompositionAssetRepository');
  });
});
