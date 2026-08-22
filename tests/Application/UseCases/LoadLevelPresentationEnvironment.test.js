import { describe, expect, it, vi } from 'vitest';
import clientBriefCatalog from '../../../data/briefs/client-briefs.v3.json';
import { LoadLevelUseCase } from '../../../src/Application/UseCases/LoadLevelUseCase.js';
import { asV2Level, loadLevelV2Dependencies } from '../../Fixtures/loadLevelV2Dependencies.js';

const item = Object.freeze({ id: 'chair-001' });
const rawBrief = clientBriefCatalog.briefs.find(brief => brief.id === 'brief-warm-host-001');
const rawLevel = asV2Level({
  id: 'level-001',
  roomId: 'room-001',
  name: 'Гостиная',
  clientBriefId: 'brief-warm-host-001',
  presentationProfileId: 'warm-starter-living',
  roomDimensions: { width: 8, depth: 6 },
  availableItems: ['chair-001']
});
const profile = Object.freeze({
  schemaVersion: 3,
  id: 'warm-starter-living',
  room: Object.freeze({ openingsPreset: 'living-window-and-door', cameraPreset: 'compact-living', exteriorCompositionPreset: 'residential-porch' }),
  lightingPreset: 'warm-evening',
  exteriorPreset: 'quiet-residential-street',
  sceneLifePreset: 'calm-indoor-evening',
  presentation: Object.freeze({ title: 'Гостиная', subtitle: 'Первые шаги' })
});

function createUseCase(presentationEnvironmentRepository) {
  return new LoadLevelUseCase(
    { loadLevel: vi.fn().mockResolvedValue(rawLevel) },
    { getItemsByIds: vi.fn().mockResolvedValue([item]) },
    { getStyleProfileById: vi.fn().mockResolvedValue({ id: 'scandinavian', label: 'Скандинавский', constraints: [{ id: 'constraint' }] }) },
    presentationEnvironmentRepository,
    { getById: vi.fn().mockResolvedValue(rawBrief) },
    loadLevelV2Dependencies()
  );
}

describe('LoadLevelUseCase presentation environment hydration', () => {
  it('hydrates an immutable presentation environment without changing RoomState or V3 evaluation inputs', async () => {
    const presentationEnvironmentRepository = { getById: vi.fn().mockResolvedValue(profile) };
    const result = await createUseCase(presentationEnvironmentRepository).execute('level-001');

    expect(result.success).toBe(true);
    expect(result.data.presentationEnvironment).toBe(profile);
    expect(result.data.roomState.width).toBe(8);
    expect(result.data.roomState.depth).toBe(6);
    expect(result.data.evaluationSpec.styleTargets[0].styleId).toBe('scandinavian');
    expect(presentationEnvironmentRepository.getById).toHaveBeenCalledWith('warm-starter-living');
  });

  it('rejects a level whose explicit presentation profile cannot be resolved', async () => {
    await expect(createUseCase({ getById: vi.fn().mockResolvedValue(null) }).execute('level-001')).resolves.toEqual({
      success: false,
      error: 'INVALID_LEVEL_DATA: Unknown presentation profile warm-starter-living'
    });
  });
});
