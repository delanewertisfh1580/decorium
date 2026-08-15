import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const root = new URL('../..', import.meta.url);
const readJson = relativePath => JSON.parse(readFileSync(new URL(relativePath, root), 'utf8'));

const EXPECTED_IDENTITIES = Object.freeze({
  'warm-starter-living': Object.freeze({
    wallTreatmentPreset: 'warm-linen-wainscot',
    builtInPreset: 'living-library-nook',
    exteriorCompositionPreset: 'residential-porch'
  }),
  'urban-media-corner': Object.freeze({
    wallTreatmentPreset: 'midnight-graphic-wallpaper',
    builtInPreset: 'media-wall-screen',
    exteriorCompositionPreset: 'urban-cinema-block'
  }),
  'bright-studio': Object.freeze({
    wallTreatmentPreset: 'sunwash-gallery-wall',
    builtInPreset: 'studio-gallery-rail',
    exteriorCompositionPreset: 'courtyard-workshop'
  })
});

describe('PROD-016 authored room identity environment content', () => {
  it('ships schema-versioned profile identity selectors for every level without introducing a semantic ambient television', () => {
    const catalog = readJson('data/presentation/environment-profiles.v2.json');
    const profileSchema = readJson('data/presentation/environment-profile.v2.schema.json');
    const levels = ['level-001', 'level-002', 'level-003'].map(id => readJson(`data/levels/${id}.json`));

    expect(catalog.schemaVersion).toBe(2);
    expect(new Ajv().compile(profileSchema)(catalog)).toBe(true);
    expect(levels.map(level => level.presentationProfileId)).toEqual(catalog.profiles.map(profile => profile.id));

    for (const profile of catalog.profiles) {
      expect(profile.schemaVersion).toBe(2);
      expect(profile.room.identity).toEqual(EXPECTED_IDENTITIES[profile.id]);
      expect(profile.ambientFixtures).not.toContain('television');
    }
  });

  it('keeps wall treatments, built-ins and exterior compositions distinct across the shipped rooms', () => {
    const catalog = readJson('data/presentation/environment-profiles.v2.json');
    const identityValues = key => catalog.profiles.map(profile => profile.room.identity[key]);

    expect(new Set(identityValues('wallTreatmentPreset')).size).toBe(3);
    expect(new Set(identityValues('builtInPreset')).size).toBe(3);
    expect(new Set(identityValues('exteriorCompositionPreset')).size).toBe(3);
  });
});
