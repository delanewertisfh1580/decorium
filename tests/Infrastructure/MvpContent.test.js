import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const catalog = readJson('data/items/catalog.v2.json');
const itemSchema = readJson('data/items/item.v2.schema.json');
const level = readJson('data/levels/level-001.json');
const levelManifest = readJson('data/levels/manifest.json');
const levels = levelManifest.levels.map(summary => readJson(`data/levels/${summary.id}.json`));
const levelSchema = readJson('data/schemas/level.schema.json');
const constraints = readJson('data/constraints/scandinavian-constraints.json');
const feedback = readJson('data/feedback/scandinavian-feedback.json');
const visualProfiles = readJson('data/visuals/item-visuals.json');

const itemIds = new Set(catalog.items.map(item => item.id));
const feedbackIds = new Set(feedback.map(message => message.id));

describe('Production content contracts', () => {
  it('validates the V2 catalog and every authored level against their schemas', () => {
    const ajv = new Ajv();
    const validateItems = ajv.compile(itemSchema);
    const validateLevel = ajv.compile(levelSchema);

    expect(validateItems(catalog)).toBe(true);
    expect(levelManifest.schemaVersion).toBe(1);
    expect(levels).toHaveLength(3);
    expect(levels.every(levelDefinition => validateLevel(levelDefinition))).toBe(true);
    expect(catalog.items).toHaveLength(33);
    expect(catalog.items.every(item => Object.keys(item.featureVector).length === 16)).toBe(true);
  });

  it('references only catalog items and declares ergonomics rules from every authored level', () => {
    expect(level.availableItems).toHaveLength(16);
    expect(levels.every(levelDefinition => levelDefinition.availableItems.every(itemId => itemIds.has(itemId)))).toBe(true);
    expect(levels.every(levelDefinition => levelDefinition.ergonomicsRules?.minimumClearance?.minimumDistance > 0)).toBe(true);
    expect(levels.every(levelDefinition => levelDefinition.ergonomicsRules?.passageZones?.length > 0)).toBe(true);
  });

  it('maps every style and ergonomics rule to a feedback message', () => {
    expect(constraints).toHaveLength(5);
    expect(constraints.every(constraint => feedbackIds.has(constraint.messageKey))).toBe(true);
    expect(feedbackIds.has('ergonomics-minimum-clearance')).toBe(true);
    expect(feedbackIds.has('ergonomics-passage-zone-free')).toBe(true);
  });

  it('keeps presentation shapes in a data-driven visual profile contract', () => {
    expect(visualProfiles.version).toBe(2);
    expect(visualProfiles.items['coffeetable-001'].shape).toBe('roundTable');
    expect(level.availableItems.every(itemId => (
      visualProfiles.items[itemId] || visualProfiles.defaults[catalog.items.find(item => item.id === itemId)?.type]
    ))).toBe(true);
  });
});
