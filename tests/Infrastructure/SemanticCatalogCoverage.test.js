import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const catalog = JSON.parse(readFileSync(join(process.cwd(), 'data/items/catalog.v4.json'), 'utf8'));
const itemsById = new Map(catalog.items.map(item => [item.id, item]));

function expectBehavior(itemId, expected) {
  expect(itemsById.get(itemId), `Missing shipped item ${itemId}`).toMatchObject({ spatialBehavior: expected });
}

describe('PROD-024 semantic catalog coverage', () => {
  it('gives every shipped item both a non-empty semantic role and an explicit spatial behavior', () => {
    expect(catalog.items).toHaveLength(34);
    for (const item of catalog.items) {
      expect(item.interactionProfile.affordances, `${item.id} must declare a semantic role`).not.toEqual([]);
      expect(item.spatialBehavior, `${item.id} must declare spatial behavior`).toMatchObject({
        schemaVersion: 1,
        placementKind: expect.any(String),
        occupancyMode: expect.any(String),
        clearanceMode: expect.any(String),
        supportMode: expect.any(String)
      });
    }
  });

  it('distinguishes floor furniture from overlays, wall/ceiling artifacts and surface-mounted objects', () => {
    expectBehavior('table-001', { placementKind: 'floor', occupancyMode: 'occupies', clearanceMode: 'obstacle', supportMode: 'surface' });
    expectBehavior('rug-001', { placementKind: 'floor-overlay', occupancyMode: 'ignored', clearanceMode: 'ignored', supportMode: 'none' });
    expectBehavior('shelf-001', { placementKind: 'wall', occupancyMode: 'ignored', clearanceMode: 'ignored', supportMode: 'surface' });
    expectBehavior('lamp-003', { placementKind: 'ceiling', occupancyMode: 'ignored', clearanceMode: 'ignored', supportMode: 'none' });
    expectBehavior('lamp-001', { placementKind: 'surface-mounted', occupancyMode: 'ignored', clearanceMode: 'ignored', supportMode: 'none' });
  });

  it('preserves the authored functional roles needed by current and follow-up spatial systems', () => {
    expect(itemsById.get('chair-003').interactionProfile.affordances).toContain('work-seat');
    expect(itemsById.get('table-003').interactionProfile.affordances).toContain('work-surface');
    expect(itemsById.get('bed-001').interactionProfile.affordances).toContain('rest-surface');
    expect(itemsById.get('tvstand-001').interactionProfile.affordances).toEqual(['storage-volume', 'media-support']);
    expect(itemsById.get('lamp-002').interactionProfile.affordances).toContain('light-source');
    expect(itemsById.get('mirror-001').interactionProfile.affordances).toContain('wall-decor');
  });
});
