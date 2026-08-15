import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const manifestPath = resolve(ROOT, 'data/visuals/lounge-pbr-assets.v1.json');
const REQUIRED_ITEMS = Object.freeze(['sofa-001', 'sofa-002', 'table-002', 'coffeetable-001']);

function readGlbJson(absolutePath) {
  const bytes = readFileSync(absolutePath);
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(header.getUint32(0, true)).toBe(0x46546c67);
  expect(header.getUint32(4, true)).toBe(2);
  const jsonLength = header.getUint32(12, true);
  expect(header.getUint32(16, true)).toBe(0x4e4f534a);
  return JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8').trim());
}

describe('PROD-013 lounge PBR asset manifest', () => {
  it('owns the two sofa and two coffee-table variants through a versioned, bounded PBR manifest', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.packId).toBe('lounge-pbr-v1');
    expect(manifest.bakeWorkflow).toBe('high-to-low-normal-plus-material-passes');
    expect(manifest.maxPackBytes).toBeLessThanOrEqual(4_800_000);
    expect(manifest.assets.map(asset => asset.itemId).sort()).toEqual([...REQUIRED_ITEMS].sort());

    for (const asset of manifest.assets) {
      expect(asset).toMatchObject({ format: 'glb', pbr: { baseColor: true, normal: true, roughness: true, ambientOcclusion: true } });
      expect(asset.path).toMatch(/^\/assets\/furniture\/lounge\/.+\.glb$/);
      expect(asset.maxBytes).toBeLessThanOrEqual(1_700_000);
    }
  });

  it('ships GLB materials with normal, metallic-roughness and ambient-occlusion texture bindings', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    let totalBytes = 0;

    for (const asset of manifest.assets) {
      const absolutePath = resolve(ROOT, 'public', asset.path.slice(1));
      const glb = readGlbJson(absolutePath);
      const material = glb.materials.find(candidate => candidate.normalTexture && candidate.occlusionTexture && candidate.pbrMetallicRoughness?.baseColorTexture && candidate.pbrMetallicRoughness?.metallicRoughnessTexture);

      expect(glb.images?.length).toBeGreaterThanOrEqual(3);
      expect(material).toBeTruthy();
      expect(statSync(absolutePath).size).toBeLessThanOrEqual(asset.maxBytes);
      totalBytes += statSync(absolutePath).size;
    }

    expect(totalBytes).toBeLessThanOrEqual(manifest.maxPackBytes);
  });
});
