import { describe, expect, it } from 'vitest';
import ItemVisualFactory from '../../src/Presentation/Scene/ItemVisualFactory.js';

const baseItem = {
  id: 'chair-001',
  name: 'Стул',
  type: 'chair',
  dimensions: { x: 1, z: 0.5 },
  featureVector: { sizeNorm: 0.5 },
  resolveConfiguration(configuration) {
    const isCompact = configuration?.variantId === 'compact';
    return {
      variantId: isCompact ? 'compact' : 'base',
      visual: {
        materialId: 'oak-light',
        color: isCompact ? '#604430' : '#a97956',
        scale: isCompact ? 0.8 : 1
      },
      dimensions: isCompact ? { x: 0.8, z: 0.4 } : { x: 1, z: 0.5 },
      featureVector: this.featureVector
    };
  }
};

describe('ItemVisualFactory item variant footprint', () => {
  it('exposes the resolved non-uniform footprint to RoomView instead of only changing material color', () => {
    const visual = ItemVisualFactory.create(baseItem, { configuration: { variantId: 'compact' } });

    expect(visual.userData.variantId).toBe('compact');
    expect(visual.userData.variantScaleVector).toEqual({ x: 0.8, y: 0.8, z: 0.8 });
    expect(visual.userData.variantVisual.color).toBe('#604430');
  });
});
