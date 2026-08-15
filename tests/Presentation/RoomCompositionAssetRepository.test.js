import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import manifest from '../../data/visuals/room-composition-pbr-assets.v1.json';
import RoomCompositionAssetRepository from '../../src/Presentation/Scene/RoomCompositionAssetRepository.js';

function sourceComposition() {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.1, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x567890 })
  );
  mesh.name = 'authored-room-composition-part';
  group.add(mesh);
  return group;
}

describe('PROD-017 RoomCompositionAssetRepository', () => {
  it('loads the selected profile composition once, returns isolated PBR-ready clones and annotates only room-composition meshes', async () => {
    let loadCalls = 0;
    const repository = new RoomCompositionAssetRepository({
      manifest,
      loadAsset: async path => {
        loadCalls += 1;
        expect(path).toBe('/assets/environment/rooms/warm-living-composition-pbr-v1.glb');
        return sourceComposition();
      }
    });

    const first = await repository.createForEnvironmentProfile('warm-starter-living');
    const second = await repository.createForEnvironmentProfile('warm-starter-living');

    expect(loadCalls).toBe(1);
    expect(first).not.toBe(second);
    expect(first.userData.assetId).toBe('warm-living-composition-pbr-v1');
    expect(first.userData.environmentProfileId).toBe('warm-starter-living');
    expect(first.userData.assetState).toBe('ready');
    expect(first.getObjectByName('authored-room-composition-part').userData.kind).toBe('room-composition-asset-part');
    expect(first.getObjectByName('authored-room-composition-part').castShadow).toBe(false);
    expect(first.getObjectByName('authored-room-composition-part').receiveShadow).toBe(true);
    expect(first.getObjectByName('authored-room-composition-part').material).not.toBe(second.getObjectByName('authored-room-composition-part').material);
  });

  it('returns null for an unknown environment profile so the existing procedural composition remains the safe fallback', async () => {
    const repository = new RoomCompositionAssetRepository({ manifest, loadAsset: async () => sourceComposition() });

    await expect(repository.createForEnvironmentProfile('unknown-room')).resolves.toBeNull();
  });
});
