import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import assetManifest from '../../data/visuals/furniture-assets.v1.json';
import loungeManifest from '../../data/visuals/lounge-pbr-assets.v1.json';
import FurnitureAssetRepository from '../../src/Presentation/Scene/FurnitureAssetRepository.js';

function sourcePrefab() {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.7, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x667788 })
  );
  mesh.name = 'authored-prefab-mesh';
  group.add(mesh);
  return group;
}

describe('PROD-012R FurnitureAssetRepository', () => {
  it('loads a seated item asset once, returns isolated clones and annotates only presentation asset meshes', async () => {
    let loadCalls = 0;
    const repository = new FurnitureAssetRepository({
      manifest: assetManifest,
      loadAsset: async path => {
        loadCalls += 1;
        expect(path).toBe('/assets/furniture/seating/dining-chair-v1.glb');
        return sourcePrefab();
      }
    });

    const first = await repository.createForItemId('chair-001');
    const second = await repository.createForItemId('chair-001');

    expect(loadCalls).toBe(1);
    expect(first).not.toBe(second);
    expect(first.userData.assetId).toBe('dining-chair-v1');
    expect(second.userData.assetId).toBe('dining-chair-v1');
    expect(first.getObjectByName('authored-prefab-mesh').userData.kind).toBe('item-asset-part');
    expect(first.getObjectByName('authored-prefab-mesh').castShadow).toBe(true);
    expect(first.getObjectByName('authored-prefab-mesh').receiveShadow).toBe(true);
  });

  it('merges independently versioned packs without changing the item-to-asset loading contract', async () => {
    const repository = new FurnitureAssetRepository({
      manifests: [assetManifest, loungeManifest],
      loadAsset: async path => {
        expect(path).toBe('/assets/furniture/lounge/sectional-hero-pbr-v1.glb');
        return sourcePrefab();
      }
    });

    const sofa = await repository.createForItemId('sofa-001');

    expect(sofa.userData.assetId).toBe('sectional-hero-pbr-v1');
    expect(sofa.userData.assetPath).toBe('/assets/furniture/lounge/sectional-hero-pbr-v1.glb');
  });

  it('returns null for non-seating item IDs so the procedural visual stays an explicit compatibility fallback', async () => {
    const repository = new FurnitureAssetRepository({ manifest: assetManifest, loadAsset: async () => sourcePrefab() });

    await expect(repository.createForItemId('sofa-001')).resolves.toBeNull();
  });
});
