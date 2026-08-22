import { describe, expect, it } from 'vitest';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import StyleInfluenceProfile from '../../../src/Domain/Scoring/StyleInfluenceProfile.js';

const styleInfluence = Object.freeze({
  schemaVersion: 1,
  mode: 'capped-square-root-footprint',
  referenceAreaM2: 1,
  minimumWeight: 0.5,
  maximumWeight: 2
});

function vector(woodShare) {
  return new FeatureVector({
    woodShare,
    metalShare: 0,
    glassShare: 0,
    plasticShare: 0,
    textileShare: 0,
    lightColorShare: 0,
    darkColorShare: 0,
    warmPaletteShare: 0,
    saturationLevel: 0,
    formSimplicity: 0,
    roundnessShare: 0,
    rectilinearShare: 0,
    sizeNorm: 0,
    priceNorm: 0,
    lightingFunctionShare: 0,
    storageFunctionShare: 0
  });
}

function placed({ id, itemId = id.split('#')[0], areaM2, woodShare = 0 }) {
  return Object.freeze({
    id,
    itemId,
    dimensions: Object.freeze({ x: areaM2, z: 1 }),
    featureVector: vector(woodShare)
  });
}

describe('StyleInfluenceProfile', () => {
  it('uses capped square-root footprint weights with exact policy boundary behavior and immutable facts', () => {
    const profile = StyleInfluenceProfile.fromPlacedItems({
      placedItems: [
        placed({ id: 'tiny#1', areaM2: 0.02, woodShare: 0 }),
        placed({ id: 'chair#1', areaM2: 0.25, woodShare: 0.2 }),
        placed({ id: 'table#1', areaM2: 1.62, woodShare: 0.8 }),
        placed({ id: 'sofa#1', areaM2: 4.5, woodShare: 1 })
      ],
      styleInfluence
    });

    expect(profile.contributions).toEqual(expect.arrayContaining([
      expect.objectContaining({ instanceId: 'tiny#1', footprintAreaM2: 0.02, influenceWeight: 0.5 }),
      expect.objectContaining({ instanceId: 'chair#1', footprintAreaM2: 0.25, influenceWeight: 0.5 }),
      expect.objectContaining({ instanceId: 'table#1', footprintAreaM2: 1.62, influenceWeight: expect.closeTo(Math.sqrt(1.62), 12) }),
      expect.objectContaining({ instanceId: 'sofa#1', footprintAreaM2: 4.5, influenceWeight: 2 })
    ]));
    expect(profile.totalWeight).toBeCloseTo(3 + Math.sqrt(1.62), 12);
    expect(profile.roomVector.woodShare).toBeCloseTo((0.1 + (0.8 * Math.sqrt(1.62)) + 2) / (3 + Math.sqrt(1.62)), 12);
    expect(profile.policy).toEqual(styleInfluence);
    expect(Object.isFrozen(profile.contributions)).toBe(true);
    expect(Object.isFrozen(profile.contributions[0])).toBe(true);
  });

  it('is permutation invariant and gives four clamped chair instances the same aggregate influence as one capped sofa', () => {
    const fourChairs = [1, 2, 3, 4].map(index => placed({ id: `chair#${index}`, itemId: 'chair', areaM2: 0.25, woodShare: 0.25 }));
    const sofa = placed({ id: 'sofa#1', itemId: 'sofa', areaM2: 4.5, woodShare: 0.75 });

    const chairProfile = StyleInfluenceProfile.fromPlacedItems({ placedItems: fourChairs, styleInfluence });
    const reversedProfile = StyleInfluenceProfile.fromPlacedItems({ placedItems: [...fourChairs].reverse(), styleInfluence });
    const sofaProfile = StyleInfluenceProfile.fromPlacedItems({ placedItems: [sofa], styleInfluence });

    expect(chairProfile.totalWeight).toBe(2);
    expect(sofaProfile.totalWeight).toBe(2);
    expect(reversedProfile.roomVector.toArray()).toEqual(chairProfile.roomVector.toArray());
    expect(reversedProfile.totalWeight).toBe(chairProfile.totalWeight);
  });

  it('rejects invalid footprints, missing canonical instance identities and unsupported policy modes', () => {
    expect(() => StyleInfluenceProfile.fromPlacedItems({
      placedItems: [placed({ id: '', areaM2: 1 })],
      styleInfluence
    })).toThrow('canonical instance id');
    expect(() => StyleInfluenceProfile.fromPlacedItems({
      placedItems: [Object.freeze({ id: 'broken#1', itemId: 'broken', dimensions: { x: 0, z: 1 }, featureVector: vector(0) })],
      styleInfluence
    })).toThrow('positive finite dimensions');
    expect(() => StyleInfluenceProfile.fromPlacedItems({
      placedItems: [placed({ id: 'chair#1', areaM2: 1 })],
      styleInfluence: { ...styleInfluence, mode: 'linear-footprint' }
    })).toThrow('mode is not supported');
  });
});
