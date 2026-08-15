import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const manifestPath = resolve(ROOT, 'data/visuals/furniture-assets.v1.json');
const REQUIRED_ITEMS = Object.freeze([
  'chair-001',
  'chair-002',
  'chair-003',
  'ottoman-001',
  'bench-001',
  'barstool-001',
  'armchair-001'
]);

describe('PROD-012R furniture asset manifest', () => {
  it('owns the seating pack through a versioned manifest with explicit runtime asset paths', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.packId).toBe('seating-foundations-v1');
    expect(manifest.assets).toHaveLength(REQUIRED_ITEMS.length);
    expect(manifest.maxPackBytes).toBeLessThanOrEqual(2_500_000);

    for (const itemId of REQUIRED_ITEMS) {
      const asset = manifest.assets.find(entry => entry.itemId === itemId);
      expect(asset).toMatchObject({ itemId, format: 'glb' });
      expect(asset.path).toMatch(/^\/assets\/furniture\/seating\/.+\.glb$/);
      expect(asset.maxBytes).toBeLessThanOrEqual(750_000);
    }
  });

  it('ships a bounded valid GLB binary for every authored seating asset', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    let packBytes = 0;

    for (const asset of manifest.assets) {
      const absolutePath = resolve(ROOT, 'public', asset.path.slice(1));
      const bytes = readFileSync(absolutePath);
      const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      expect(header.getUint32(0, true)).toBe(0x46546c67);
      expect(header.getUint32(4, true)).toBe(2);
      expect(header.getUint32(8, true)).toBe(bytes.byteLength);
      expect(statSync(absolutePath).size).toBeLessThanOrEqual(asset.maxBytes);
      packBytes += bytes.byteLength;
    }

    expect(packBytes).toBeLessThanOrEqual(manifest.maxPackBytes);
  });
});
