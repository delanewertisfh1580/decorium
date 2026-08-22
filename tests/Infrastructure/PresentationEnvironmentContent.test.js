import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const root = new URL('../..', import.meta.url);
const readJson = relativePath => JSON.parse(readFileSync(new URL(relativePath, root), 'utf8'));

describe('authored presentation environments', () => {
  it('gives every shipped level a distinct schema-valid versioned presentation profile', () => {
    const catalog = readJson('data/presentation/environment-profiles.v3.json');
    const profileSchema = readJson('data/presentation/environment-profile.v3.schema.json');
    const levelSchema = readJson('data/schemas/level.v2.schema.json');
    const levels = ['level-001', 'level-002', 'level-003'].map(id => readJson(`data/levels/${id}.json`));

    expect(catalog.schemaVersion).toBe(3);
    expect(catalog.profiles.map(profile => profile.id)).toEqual([
      'warm-starter-living',
      'urban-media-corner',
      'bright-studio'
    ]);
    expect(new Ajv().compile(profileSchema)(catalog)).toBe(true);

    const validateLevel = new Ajv().compile(levelSchema);
    expect(levels.map(level => level.presentationProfileId)).toEqual(catalog.profiles.map(profile => profile.id));
    expect(new Set(levels.map(level => level.presentationProfileId)).size).toBe(3);
    levels.forEach(level => expect(validateLevel(level)).toBe(true));
  });

  it('keeps the player-placed television as the only view target in the media level presentation', () => {
    const catalog = readJson('data/presentation/environment-profiles.v3.json');
    const mediaProfile = catalog.profiles.find(profile => profile.id === 'urban-media-corner');

    expect(mediaProfile).not.toHaveProperty('ambientFixtures');
    expect(mediaProfile.room).not.toHaveProperty('identity');
    expect(mediaProfile.room.exteriorCompositionPreset).toBe('urban-cinema-block');
    expect(JSON.stringify(mediaProfile)).not.toContain('television');
  });
});
