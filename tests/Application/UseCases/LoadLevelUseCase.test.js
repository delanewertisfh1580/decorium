import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import LoadLevelUseCase from '../../../src/Application/UseCases/LoadLevelUseCase.js';
import LevelDTO from '../../../src/Application/DTOs/LevelDTO.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { asV2Level, loadLevelV2Dependencies } from '../../Fixtures/loadLevelV2Dependencies.js';

const briefCatalog = JSON.parse(readFileSync('data/briefs/client-briefs.v2.json', 'utf8'));
const activeBrief = briefCatalog.briefs.find(brief => brief.id === 'brief-warm-host-001');
const activeLevel = asV2Level({
  id: 'level-001',
  roomId: 'room-001',
  roomDimensions: { width: 5, depth: 5 },
  availableItems: ['chair-001'],
  clientBriefId: 'brief-warm-host-001',
  presentationProfileId: 'warm-starter-living'
});

function createUseCase({ level = activeLevel } = {}) {
  return new LoadLevelUseCase(
    { loadLevel: async levelId => levelId === 'missing' ? null : level },
    { getItemsByIds: async ids => ids.map(id => ({ id, name: id })) },
    {
      getStyleProfileById: async styleId => ({
        id: styleId,
        label: styleId,
        constraints: [{ id: `${styleId}-constraint` }]
      })
    },
    { getById: async id => id === 'warm-starter-living' ? { id } : null },
    { getById: async id => id === activeBrief.id ? activeBrief : null },
    loadLevelV2Dependencies()
  );
}

describe('LoadLevelUseCase V2', () => {
  it('rejects an empty level identifier', async () => {
    await expect(createUseCase().execute('')).resolves.toMatchObject({
      success: false,
      error: 'INVALID_INPUT: Level ID must be a non-empty string.'
    });
  });

  it('returns a typed failure when the authored level is absent', async () => {
    await expect(createUseCase().execute('missing')).resolves.toMatchObject({
      success: false,
      error: "LEVEL_NOT_FOUND: Level with ID 'missing' not found."
    });
  });

  it('rejects a level without required V2 topology and references', async () => {
    await expect(createUseCase({ level: { id: 'level-001' } }).execute('level-001')).resolves.toMatchObject({
      success: false,
      error: 'INVALID_LEVEL_DATA: Missing required V2 level references or topology.'
    });
  });

  it('hydrates active V2 brief, exact style profiles and presentation data into LevelDTO', async () => {
    const result = await createUseCase().execute('level-001');

    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(LevelDTO);
    expect(result.data.levelId).toBe('level-001');
    expect(result.data.roomId).toBe('room-001');
    expect(result.data.roomState).toBeInstanceOf(RoomState);
    expect(result.data.availableItems).toEqual([{ id: 'chair-001', name: 'chair-001' }]);
    expect(result.data.evaluationSpec).toMatchObject({
      schemaVersion: 1,
      styleTargets: expect.arrayContaining([expect.objectContaining({ styleId: 'scandinavian', role: 'primary' })]),
      completion: { minimumStars: 3, criticalRuleMode: 'block-completion' }
    });
    expect(Object.isFrozen(result.data.evaluationSpec)).toBe(true);
  });
});
