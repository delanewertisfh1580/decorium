import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import GenerateEndlessLevelUseCase from '../../../src/Application/UseCases/GenerateEndlessLevelUseCase.js';

const root = process.cwd();
const catalog = JSON.parse(readFileSync(join(root, 'data/endless/endless-blueprints.v1.json'), 'utf8'));
const blueprint = catalog.blueprints[0];

function createUseCase({ presentationEnvironment = { id: blueprint.presentationProfileId } } = {}) {
  const roomState = { clone: vi.fn(() => ({ resetBaseline: true })) };
  const profile = {
    profileId: 'profile-001',
    unlockedIds: ['base-interior'],
    hasUnlock: vi.fn(() => true)
  };
  const generated = {
    blueprint,
    room: { width: 7, depth: 5 },
    availableItems: [{ id: 'sofa-001' }],
    interiorRecipe: { schemaVersion: 1, placements: [] }
  };
  const roomInteriorGenerator = {
    generate: vi.fn(() => ({ success: true, data: { roomState } }))
  };
  const useCase = new GenerateEndlessLevelUseCase({
    endlessBlueprintCatalog: { listBlueprints: vi.fn(async () => [blueprint]) },
    itemCatalog: { getAllItems: vi.fn(async () => generated.availableItems) },
    constraintCatalog: {
      getStyleProfileById: vi.fn(async styleId => ({ label: styleId, constraints: [{ id: 'rule-1' }] }))
    },
    presentationEnvironmentRepository: { getById: vi.fn(async () => presentationEnvironment) },
    surfaceFinishCatalog: {
      listFinishes: vi.fn(async () => [
        { id: blueprint.surfaceDefaults.floorFinishId, surface: 'floor', unlockId: 'base-interior' },
        { id: blueprint.surfaceDefaults.wallFinishId, surface: 'wall', unlockId: 'base-interior' }
      ])
    },
    getPlayerProfile: () => profile,
    endlessLevelGenerator: { generate: vi.fn(() => ({ success: true, data: generated })) },
    roomInteriorGenerator
  });
  return { useCase, roomInteriorGenerator, profile };
}

describe('GenerateEndlessLevelUseCase', () => {
  it('materializes an ephemeral mode DTO with deterministic seed identity and blueprint-authored client-priority feedback', async () => {
    const { useCase, roomInteriorGenerator } = createUseCase();

    const result = await useCase.execute({ seed: 77 });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      levelId: 'endless-77',
      roomId: 'endless-room-77',
      generationSeed: 77,
      mode: 'endless',
      run: { seed: 77, blueprintId: blueprint.id }
    });
    expect(result.data.baselineRoomState).not.toBe(result.data.roomState);
    expect(result.data.clientBrief.clientPriorities).toEqual([expect.objectContaining({
      label: blueprint.clientPriority.label,
      rule: expect.objectContaining({ messageKey: blueprint.clientPriority.messageKey })
    })]);
    expect(roomInteriorGenerator.generate).toHaveBeenCalledWith(expect.objectContaining({
      allowedItemIds: new Set(['sofa-001'])
    }));
  });

  it('fails safely when the generated blueprint refers to a missing presentation environment', async () => {
    const { useCase } = createUseCase({ presentationEnvironment: null });

    await expect(useCase.execute({ seed: 77 })).resolves.toEqual({
      success: false,
      error: `ENDLESS_PRESENTATION_MISSING: ${blueprint.presentationProfileId}`
    });
  });
});
