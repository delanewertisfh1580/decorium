import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import ItemVisualFactory, { VISUAL_DETAIL_CONTRACT } from '../../src/Presentation/Scene/ItemVisualFactory.js';
import visualProfiles from '../../data/visuals/item-visuals.json';

const vector = {
  sizeNorm: 0.5
};

function item(id, type, dimensions = { x: 1, z: 0.6 }) {
  return { id, name: id, type, dimensions, featureVector: vector };
}

describe('UI-VIS-003 expressive item visuals', () => {
  it('builds a rich, profile-driven visual for every supported visual shape', () => {
    const items = [
      item('sofa-001', 'sofa', { x: 2.2, z: 0.9 }),
      item('chair-001', 'chair'),
      item('table-001', 'table'),
      item('coffeetable-001', 'table'),
      item('desk-001', 'table', { x: 1.6, z: 0.8 }),
      item('lamp-001', 'lighting'),
      item('lamp-002', 'lighting'),
      item('lamp-003', 'lighting'),
      item('shelf-001', 'storage'),
      item('shelf-002', 'storage'),
      item('cabinet-001', 'storage'),
      item('bed-001', 'bed', { x: 1.8, z: 2 }),
      item('plant-001', 'decor'),
      item('mirror-001', 'decor', { x: 0.8, z: 0.05 }),
      item('rug-001', 'decor', { x: 2.2, z: 1.5 }),
      item('vase-001', 'decor'),
      item('clock-001', 'decor')
    ];

    for (const entry of items) {
      const visual = ItemVisualFactory.create(entry);
      const parts = visual.children.filter(child => child.userData.kind === 'item-part');

      expect(visual.userData.visualShape).toBeTruthy();
      expect(visual.userData.detailLevel).toBe('rich');
      expect(parts.length).toBeGreaterThanOrEqual(VISUAL_DETAIL_CONTRACT.minimumParts);
      expect(visual.getObjectByName('selection-halo')).not.toBeNull();
    }
  });

  it('supports every explicit profile shape without reducing it to generic decor', () => {
    for (const [id, profile] of Object.entries(visualProfiles.items)) {
      const visual = ItemVisualFactory.create(item(id, 'decor'));
      expect(visual.userData.visualShape).toBe(profile.shape);
      expect(visual.userData.detailLevel).toBe('rich');
    }
  });

  it('renders the authored view target as a dedicated television rather than generic decor', () => {
    const visual = ItemVisualFactory.create(item('tv-001', 'media', { x: 1.6, z: 0.3 }));

    expect(visual.userData.visualShape).toBe('television');
    expect(visual.getObjectByName('tv-screen')).not.toBeNull();
    expect(visual.getObjectByName('tv-stand')).not.toBeNull();
  });

  it('uses a separate, responsive selection halo and keeps ghost feedback visible', () => {
    const visual = ItemVisualFactory.create(item('chair-001', 'chair'));
    const halo = visual.getObjectByName('selection-halo');

    expect(halo.visible).toBe(false);
    ItemVisualFactory.setSelected(visual, true);
    expect(halo.visible).toBe(true);
    expect(halo.material.opacity).toBeGreaterThan(0);

    ItemVisualFactory.setGhostValidity(visual, false);
    expect(visual.userData.feedbackState).toBe('invalid');
    expect(visual.userData.feedbackAccent).toBe('error');
    expect(halo.visible).toBe(true);
  });

  it('keeps feedback objects out of raycast item-part accounting', () => {
    const visual = ItemVisualFactory.create(item('mirror-001', 'decor', { x: 0.8, z: 0.05 }));
    const hitProxy = visual.getObjectByName('item-hit-proxy');
    const halo = visual.getObjectByName('selection-halo');

    expect(hitProxy?.userData.kind).toBe('item-hit-proxy');
    expect(halo?.userData.kind).toBe('item-feedback');
    expect(halo?.raycast).toBeTypeOf('function');
  });
});
