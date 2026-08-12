import { describe, expect, it } from 'vitest';
import {
  LIFE_ANIMATION_CONFIG,
  getGaitPose,
  getTelevisionMotion,
  getRouteMotion
} from '../../src/Presentation/Scene/lifeAnimationConfig.js';

describe('UI-ROOM-005 living animation contract', () => {
  it('uses a natural tempo and bounded, linked gait profiles', () => {
    expect(LIFE_ANIMATION_CONFIG.gaits.pedestrian.strideFrequency).toBeGreaterThanOrEqual(1);
    expect(LIFE_ANIMATION_CONFIG.gaits.pedestrian.strideFrequency).toBeLessThanOrEqual(3);
    expect(LIFE_ANIMATION_CONFIG.gaits.animal.strideFrequency).toBeGreaterThanOrEqual(1.5);
    expect(LIFE_ANIMATION_CONFIG.gaits.animal.strideFrequency).toBeLessThanOrEqual(4);
    expect(LIFE_ANIMATION_CONFIG.gaits.pedestrian.armSwing).toBeGreaterThan(0);
    expect(LIFE_ANIMATION_CONFIG.gaits.pedestrian.armSwing).toBeLessThanOrEqual(
      LIFE_ANIMATION_CONFIG.gaits.pedestrian.legSwing
    );

    const pedestrian = getGaitPose(1.25, 0.12, 'pedestrian');
    const animal = getGaitPose(1.25, 0.12, 'animal');

    expect(pedestrian.legs).toHaveLength(2);
    expect(pedestrian.arms).toHaveLength(2);
    expect(pedestrian.arms[0]).toBeCloseTo(-pedestrian.arms[1]);
    expect(pedestrian.bodyBob).toBeGreaterThanOrEqual(0);
    expect(pedestrian.bodyBob).toBeLessThanOrEqual(LIFE_ANIMATION_CONFIG.gaits.pedestrian.bodyBob);
    expect(animal.legs).toHaveLength(4);
    expect(animal.tailSwing).toBeGreaterThanOrEqual(-LIFE_ANIMATION_CONFIG.gaits.animal.tailSwing);
    expect(animal.tailSwing).toBeLessThanOrEqual(LIFE_ANIMATION_CONFIG.gaits.animal.tailSwing);
  });

  it('keeps route motion deterministic and exposes travel direction', () => {
    const route = { start: -0.2, end: 1.2, speed: 0.05, phase: 0.25 };
    expect(getRouteMotion(4, route)).toEqual(getRouteMotion(4, route));
    expect(getRouteMotion(4, route).progress).toBeCloseTo(0.45);
    expect(getRouteMotion(4, route).direction).toBe(1);
    expect(getRouteMotion(4, { ...route, start: 1.2, end: -0.2 }).direction).toBe(-1);
  });

  it('provides varied television content instead of a static color pulse', () => {
    const first = getTelevisionMotion(0.5);
    const second = getTelevisionMotion(1.7);

    expect(first.frame).toBeGreaterThanOrEqual(0);
    expect(first.frame).toBeLessThan(1);
    expect(first.barOffsets).toHaveLength(LIFE_ANIMATION_CONFIG.television.barCount);
    expect(first.contentOffsets).toHaveLength(LIFE_ANIMATION_CONFIG.television.contentBlockCount);
    expect(first.glow).toBeGreaterThan(0);
    expect(first.barOffsets).not.toEqual(second.barOffsets);
    expect(first.contentOffsets).not.toEqual(second.contentOffsets);
    expect(getTelevisionMotion(0.5)).toEqual(first);
  });
});
