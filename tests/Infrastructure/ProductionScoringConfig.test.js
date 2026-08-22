import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const parameters = JSON.parse(readFileSync('data/scoring/scoring-parameters.json', 'utf8'));

describe('PROD-023 production scoring configuration', () => {
  it('declares explicit normalized channel weights and capped square-root style influence', () => {
    expect(parameters.schemaVersion).toBe(3);
    expect(parameters.channelWeights).toEqual({
      style: 0.5,
      clientPriorities: 0.2,
      ergonomics: 0.3
    });
    expect(Object.values(parameters.channelWeights).reduce((total, weight) => total + weight, 0)).toBeCloseTo(1, 12);
    expect(parameters.styleBlend).toEqual({ targetFit: 0.75, composition: 0.25 });
    expect(parameters.styleInfluence).toEqual({
      schemaVersion: 1,
      mode: 'capped-square-root-footprint',
      referenceAreaM2: 1,
      minimumWeight: 0.5,
      maximumWeight: 2
    });
  });
});
