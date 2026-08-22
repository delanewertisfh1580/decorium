import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const catalog = readJson('data/items/catalog.v5.json');
const itemSchema = readJson('data/items/item.v5.schema.json');
const level = readJson('data/levels/level-001.json');
const levelManifest = readJson('data/levels/manifest.json');
const levels = levelManifest.levels.map(summary => readJson(`data/levels/${summary.id}.json`));
const levelSchema = readJson('data/schemas/level.v2.schema.json');
const clientBriefSchema = readJson('data/briefs/client-brief.v3.schema.json');
const clientBriefCatalog = readJson('data/briefs/client-briefs.v3.json');
const clientBriefsById = new Map(clientBriefCatalog.briefs.map(brief => [brief.id, brief]));
const styleConstraintCatalog = readJson('data/styles/style-constraint-catalog.v1.json');
const constraints = styleConstraintCatalog.profiles.flatMap(profile => profile.constraints);
const feedback = readJson('data/feedback/scandinavian-feedback.json');
const visualProfiles = readJson('data/visuals/item-visuals.json');

const itemIds = new Set(catalog.items.map(item => item.id));
const feedbackIds = new Set(feedback.map(message => message.id));

describe('Production content contracts', () => {
  it('validates the V5 catalog and every authored level against their schemas', () => {
    const ajv = new Ajv();
    const validateItems = ajv.compile(itemSchema);
    const validateLevel = ajv.compile(levelSchema);
    const validateBriefs = ajv.compile(clientBriefSchema);

    expect(validateItems(catalog)).toBe(true);
    expect(levelManifest.schemaVersion).toBe(1);
    expect(levels).toHaveLength(3);
    expect(levels.every(levelDefinition => validateLevel(levelDefinition))).toBe(true);
    expect(validateBriefs(clientBriefCatalog)).toBe(true);
    expect(catalog.items).toHaveLength(34);
    expect(catalog.items.every(item => Object.keys(item.featureVector).length === 16)).toBe(true);
  });

  it('references only catalog items and resolves complete client-owned ergonomics policy for every authored level', () => {
    expect(level.availableItems).toHaveLength(16);
    expect(levels.every(levelDefinition => levelDefinition.availableItems.every(itemId => itemIds.has(itemId)))).toBe(true);
    expect(levels.every(levelDefinition => clientBriefsById.get(levelDefinition.clientBriefId)?.levelId === levelDefinition.id)).toBe(true);
    expect(levels.every(levelDefinition => clientBriefsById.get(levelDefinition.clientBriefId)?.evaluationPolicy.ergonomicsRules.minimumClearance.minimumDistance > 0)).toBe(true);
    expect(levels.every(levelDefinition => clientBriefsById.get(levelDefinition.clientBriefId)?.evaluationPolicy.ergonomicsRules.passageZones.length > 0)).toBe(true);
  });

  it('defines a deterministic prerequisite chain for the authored campaign', () => {
    expect(levelManifest.levels.map(levelSummary => levelSummary.prerequisiteLevelId ?? null)).toEqual([
      null,
      'level-001',
      'level-002'
    ]);
  });

  it('maps every active style and ergonomics rule to a feedback message', () => {
    expect(constraints.length).toBeGreaterThan(0);
    expect(constraints.every(constraint => feedbackIds.has(constraint.messageKey))).toBe(true);
    expect(feedbackIds.has('ergonomics-minimum-clearance')).toBe(true);
    expect(feedbackIds.has('ergonomics-passage-zone-free')).toBe(true);
  });

  it('keeps presentation shapes in a data-driven visual profile contract', () => {
    expect(visualProfiles.version).toBe(3);
    expect(visualProfiles.items['coffeetable-001'].shape).toBe('roundTable');
    expect(visualProfiles.items['chair-002'].visualFamily).toBe('loungeArmchair');
    expect(level.availableItems.every(itemId => (
      visualProfiles.items[itemId] || visualProfiles.defaults[catalog.items.find(item => item.id === itemId)?.type]
    ))).toBe(true);
  });
});
