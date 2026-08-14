import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourcePath = resolve(root, 'data/items/catalog.v2.json');
const targetPath = resolve(root, 'data/items/catalog.v3.json');

const profilesByItemId = Object.freeze({
  'chair-001': { affordances: ['dining-seat'], frontAxis: 'positiveZ', usableSides: [] },
  'chair-002': { affordances: ['lounge-seat'], frontAxis: 'positiveZ', usableSides: [] },
  'table-001': { affordances: ['dining-surface'], frontAxis: null, usableSides: ['positiveX', 'negativeX', 'positiveZ', 'negativeZ'] },
  'table-002': { affordances: ['coffee-surface'], frontAxis: null, usableSides: [] },
  'sofa-001': { affordances: ['lounge-seat'], frontAxis: 'positiveZ', usableSides: [] },
  'sofa-002': { affordances: ['lounge-seat'], frontAxis: 'positiveZ', usableSides: [] },
  'coffeetable-001': { affordances: ['coffee-surface'], frontAxis: null, usableSides: [] }
});

const legacyCatalog = JSON.parse(readFileSync(sourcePath, 'utf8'));
const catalog = {
  schemaVersion: 3,
  $schema: 'item.v3.json',
  items: legacyCatalog.items.map(item => ({
    ...item,
    interactionProfile: {
      schemaVersion: 1,
      ...(profilesByItemId[item.id] ?? { affordances: [], frontAxis: null, usableSides: [] })
    }
  }))
};

writeFileSync(targetPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Migrated ${catalog.items.length} items: ${targetPath}`);
