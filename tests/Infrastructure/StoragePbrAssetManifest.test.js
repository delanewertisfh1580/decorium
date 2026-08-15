import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const manifestPath = resolve(ROOT, 'data/visuals/storage-pbr-assets.v1.json');
const REQUIRED_ITEMS = Object.freeze([
  'shelf-001',
  'shelf-002',
  'cabinet-001',
  'shelf-003',
  'sideboard-001',
  'tvstand-001',
  'nightstand-001',
]);

function readGlbJson(absolutePath) {
  const bytes = readFileSync(absolutePath);
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(header.getUint32(0, true)).toBe(0x46546c67);
  expect(header.getUint32(4, true)).toBe(2);
  const jsonLength = header.getUint32(12, true);
  expect(header.getUint32(16, true)).toBe(0x4e4f534a);
  return JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8').trim());
}

describe('PROD-015 storage PBR asset manifest', () => {
  it('owns every shelf, cabinet, chest and stand through a versioned bounded PBR manifest', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.packId).toBe('storage-pbr-v1');
    expect(manifest.bakeWorkflow).toBe('high-to-low-normal-plus-material-passes');
    expect(manifest.maxPackBytes).toBeLessThanOrEqual(6_600_000);
    expect(manifest.assets.map(asset => asset.itemId).sort()).toEqual([...REQUIRED_ITEMS].sort());

    for (const asset of manifest.assets) {
      expect(asset).toMatchObject({
        format: 'glb',
        textureSet: 'basecolor-normal-orm',
        textureVariant: 'png-embedded',
        requiresUv1: true,
        pbr: { baseColor: true, normal: true, roughness: true, ambientOcclusion: true },
      });
      expect(asset.path).toMatch(/^\/assets\/furniture\/storage\/.+\.glb$/);
      expect(asset.maxBytes).toBeLessThanOrEqual(1_250_000);
    }
  });

  it('ships UV1-capable GLB materials with base colour, normal, metallic-roughness and AO bindings', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    let totalBytes = 0;

    for (const asset of manifest.assets) {
      const absolutePath = resolve(ROOT, 'public', asset.path.slice(1));
      const glb = readGlbJson(absolutePath);
      const material = glb.materials.find(candidate => {
        const pbr = candidate.pbrMetallicRoughness;
        return candidate.normalTexture && candidate.occlusionTexture?.texCoord === 1
          && pbr?.baseColorTexture && pbr?.metallicRoughnessTexture;
      });
      const pbrPrimitive = glb.meshes
        .flatMap(mesh => mesh.primitives ?? [])
        .find(primitive => primitive.attributes?.TEXCOORD_0 !== undefined && primitive.attributes?.TEXCOORD_1 !== undefined);

      expect(glb.images?.length).toBeGreaterThanOrEqual(3);
      expect(material).toBeTruthy();
      expect(pbrPrimitive).toBeTruthy();
      expect(statSync(absolutePath).size).toBeLessThanOrEqual(asset.maxBytes);
      totalBytes += statSync(absolutePath).size;
    }

    expect(totalBytes).toBeLessThanOrEqual(manifest.maxPackBytes);
  });
});
