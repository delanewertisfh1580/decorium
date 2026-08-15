import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const manifestPath = resolve(ROOT, 'data/visuals/room-composition-pbr-assets.v1.json');
const REQUIRED_PROFILES = Object.freeze([
  'warm-starter-living',
  'urban-media-corner',
  'bright-studio',
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

function primitiveTriangleCount(glb, primitive) {
  const accessorIndex = primitive.indices ?? primitive.attributes?.POSITION;
  return accessorIndex === undefined ? 0 : glb.accessors[accessorIndex].count / 3;
}

describe('PROD-017 room composition PBR asset manifest', () => {
  it('owns exactly one static, lazy and fallback-safe PBR composition for every authored room profile', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.packId).toBe('room-composition-pbr-v1');
    expect(manifest.maxPackBytes).toBeLessThanOrEqual(3_750_000);
    expect(manifest.performanceBudget).toEqual({
      maxStaticDrawCalls: 40,
      maxMaterials: 12,
      maxTrianglesPerRoom: 48_000,
    });
    expect(manifest.assets.map(asset => asset.environmentProfileId).sort()).toEqual([...REQUIRED_PROFILES].sort());

    for (const asset of manifest.assets) {
      expect(asset).toMatchObject({
        format: 'glb',
        role: 'static-room-composition',
        delivery: 'lazy-active-profile',
        fallback: 'procedural-identity',
        textureSet: 'basecolor-normal-orm',
        textureVariant: 'png-embedded',
        requiresUv1: true,
        pbr: { baseColor: true, normal: true, roughness: true, ambientOcclusion: true },
      });
      expect(asset.path).toMatch(/^\/assets\/environment\/rooms\/.+\.glb$/);
      expect(asset.maxBytes).toBeLessThanOrEqual(1_250_000);
      expect(asset.maxTriangles).toBeLessThanOrEqual(manifest.performanceBudget.maxTrianglesPerRoom);
      expect(asset.maxMaterials).toBeLessThanOrEqual(manifest.performanceBudget.maxMaterials);
    }
  });

  it('ships UV1-capable GLB materials and keeps each authored composition within its declared payload and primitive budget', () => {
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
      const texturedPrimitive = glb.meshes
        .flatMap(mesh => mesh.primitives ?? [])
        .find(primitive => primitive.attributes?.TEXCOORD_0 !== undefined && primitive.attributes?.TEXCOORD_1 !== undefined);

      expect(glb.images?.length).toBeGreaterThanOrEqual(3);
      expect(material).toBeTruthy();
      expect(texturedPrimitive).toBeTruthy();
      const triangleCount = glb.meshes
        .flatMap(mesh => mesh.primitives ?? [])
        .reduce((total, primitive) => total + primitiveTriangleCount(glb, primitive), 0);

      expect(glb.materials.length).toBeLessThanOrEqual(asset.maxMaterials);
      expect(triangleCount).toBeLessThanOrEqual(asset.maxTriangles);
      expect(statSync(absolutePath).size).toBeLessThanOrEqual(asset.maxBytes);
      totalBytes += statSync(absolutePath).size;
    }

    expect(totalBytes).toBeLessThanOrEqual(manifest.maxPackBytes);
  });
});
