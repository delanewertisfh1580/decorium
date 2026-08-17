import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const parameters = JSON.parse(readFileSync('data/scoring/scoring-parameters.json', 'utf8'));

describe('PROD-023 production scoring configuration', () => {
  it('declares explicit normalized style, client-priority and ergonomics channel weights', () => {
    expect(parameters.schemaVersion).toBe(2);
    expect(parameters.channelWeights).toEqual({
      style: 0.5,
      clientPriorities: 0.2,
      ergonomics: 0.3
    });
    expect(Object.values(parameters.channelWeights).reduce((total, weight) => total + weight, 0)).toBeCloseTo(1, 12);
    expect(parameters.styleBlend).toEqual({ targetFit: 0.75, composition: 0.25 });
  });
});
