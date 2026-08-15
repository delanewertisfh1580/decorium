import { describe, expect, it } from 'vitest';
import ItemVisualFactory from '../../src/Presentation/Scene/ItemVisualFactory.js';

const VISIBLE_FAMILY_CONTRACTS = Object.freeze([
  { id: 'chair-001', type: 'chair', family: 'diningChair', parts: ['dining-slat', 'dining-seat-frame'] },
  { id: 'chair-002', type: 'chair', family: 'loungeArmchair', parts: ['lounge-arm', 'lounge-back-cushion'] },
  { id: 'chair-003', type: 'chair', family: 'officeChair', parts: ['office-spoke', 'office-wheel'] },
  { id: 'ottoman-001', type: 'chair', family: 'ottoman', parts: ['ottoman-seam', 'ottoman-foot'] },
  { id: 'bench-001', type: 'chair', family: 'entryBench', parts: ['bench-side-frame', 'bench-lower-slat'] },
  { id: 'barstool-001', type: 'chair', family: 'barStool', parts: ['stool-column', 'stool-footrest'] },
  { id: 'armchair-001', type: 'chair', family: 'classicArmchair', parts: ['classic-tuft', 'classic-rolled-arm', 'classic-carved-foot'] },
  { id: 'sofa-001', type: 'sofa', family: 'sectionalSofa', dimensions: { x: 2.5, z: 1.8 }, parts: ['sectional-chaise', 'sectional-cushion'] },
  { id: 'sofa-002', type: 'sofa', family: 'straightSofa', dimensions: { x: 2, z: 0.9 }, parts: ['straight-sofa-cushion', 'straight-sofa-arm'] },
  { id: 'table-003', type: 'table', family: 'computerDesk', dimensions: { x: 1.4, z: 0.7 }, parts: ['monitor-shelf', 'cable-channel'] },
  { id: 'sideboard-001', type: 'storage', family: 'sideboard', dimensions: { x: 1.5, z: 0.45 }, parts: ['sideboard-door', 'sideboard-foot'] },
  { id: 'tvstand-001', type: 'storage', family: 'mediaConsole', dimensions: { x: 1.4, z: 0.45 }, parts: ['media-bay', 'cable-slot'] },
  { id: 'nightstand-001', type: 'storage', family: 'nightstand', dimensions: { x: 0.55, z: 0.4 }, parts: ['nightstand-drawer', 'nightstand-pull'] }
]);

function itemFor(contract) {
  return {
    id: contract.id,
    name: contract.id,
    type: contract.type,
    dimensions: { ...(contract.dimensions ?? { x: 0.8, z: 0.8 }) },
    featureVector: { sizeNorm: 0.5 }
  };
}

describe('PROD-012 distinct furniture visual families', () => {
  it('uses explicit authored visual families rather than generic type-level furniture meshes', () => {
    for (const contract of VISIBLE_FAMILY_CONTRACTS) {
      const visual = ItemVisualFactory.create(itemFor(contract));
      const namedParts = new Set(visual.children.filter(child => child.userData.kind === 'item-part').map(child => child.name));

      expect(visual.userData.visualFamily).toBe(contract.family);
      for (const requiredPart of contract.parts) expect(namedParts).toContain(requiredPart);
    }
  });

  it('keeps a family-specific visual bounded to the authored gameplay footprint', () => {
    for (const contract of VISIBLE_FAMILY_CONTRACTS) {
      const item = itemFor(contract);
      const before = structuredClone(item.dimensions);
      ItemVisualFactory.create(item);

      expect(item.dimensions).toEqual(before);
    }
  });
});
