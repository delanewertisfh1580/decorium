import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import ItemVisualFactory from '../../src/Presentation/Scene/ItemVisualFactory.js';

const item = {
  id: 'chair-001',
  type: 'chair',
  dimensions: { x: 0.5, z: 0.5 },
  featureVector: { sizeNorm: 0.5 }
};

function authoredAsset() {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), new THREE.MeshStandardMaterial({ color: 0x556677 }));
  mesh.name = 'authored-seat-asset';
  mesh.userData.kind = 'item-asset-part';
  group.add(mesh);
  group.userData.assetId = 'dining-chair-v1';
  return group;
}

describe('PROD-012R item visual asset attachment', () => {
  it('mounts a ready GLB asset while preserving the procedural fallback as a hidden compatibility layer and retaining interaction overlays', () => {
    const visual = ItemVisualFactory.create(item);
    const fallbackParts = visual.children.filter(child => child.userData.kind === 'item-part');
    const halo = visual.getObjectByName('selection-halo');

    ItemVisualFactory.attachAsset(visual, authoredAsset());

    expect(visual.userData.assetState).toBe('ready');
    expect(fallbackParts.every(part => part.visible === false)).toBe(true);
    expect(visual.getObjectByName('authored-seat-asset').userData.kind).toBe('item-asset-part');
    expect(halo.userData.kind).toBe('item-feedback');
  });

  it('applies ghost feedback to authored asset mesh without making the interaction proxy selectable', () => {
    const visual = ItemVisualFactory.create(item, { ghost: true });
    ItemVisualFactory.attachAsset(visual, authoredAsset());
    ItemVisualFactory.setGhostValidity(visual, false);

    const assetMesh = visual.getObjectByName('authored-seat-asset');
    expect(assetMesh.material.transparent).toBe(true);
    expect(assetMesh.material.opacity).toBeLessThan(1);
    expect(visual.getObjectByName('selection-halo').userData.kind).toBe('item-feedback');
  });
});
