import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const catalog = readJson('data/items/catalog.v2.json');
const itemSchema = readJson('data/items/item.v2.schema.json');
const level = readJson('data/levels/level-001.json');
const levelSchema = readJson('data/schemas/level.schema.json');
const constraints = readJson('data/constraints/scandinavian-constraints.json');
const feedback = readJson('data/feedback/scandinavian-feedback.json');
const visualProfiles = readJson('data/visuals/item-visuals.json');

const itemIds = new Set(catalog.items.map(item => item.id));
const feedbackIds = new Set(feedback.map(message => message.id));

describe('MVP content contracts', () => {
  it('validates the V2 catalog and level against their schemas', () => {
    const ajv = new Ajv();
    const validateItems = ajv.compile(itemSchema);
    const validateLevel = ajv.compile(levelSchema);

    expect(validateItems(catalog)).toBe(true);
    expect(validateLevel(level)).toBe(true);
    expect(catalog.items).toHaveLength(33);
    expect(catalog.items.every(item => Object.keys(item.featureVector).length === 16)).toBe(true);
  });

  it('references only catalog items from level-001', () => {
    expect(level.availableItems).toHaveLength(16);
    expect(level.availableItems.every(itemId => itemIds.has(itemId))).toBe(true);
  });

  it('maps every style constraint to a feedback message', () => {
    expect(constraints).toHaveLength(5);
    expect(constraints.every(constraint => feedbackIds.has(constraint.messageKey))).toBe(true);
  });

  it('keeps presentation shapes in a data-driven visual profile contract', () => {
    expect(visualProfiles.version).toBe(2);
    expect(visualProfiles.items['coffeetable-001'].shape).toBe('roundTable');
    expect(level.availableItems.every(itemId => (
      visualProfiles.items[itemId] || visualProfiles.defaults[catalog.items.find(item => item.id === itemId)?.type]
    ))).toBe(true);
  });
});
