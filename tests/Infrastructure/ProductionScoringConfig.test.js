import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const parameters = JSON.parse(readFileSync('data/scoring/scoring-parameters.json', 'utf8'));

describe('PROD-003 scoring configuration', () => {
  it('assigns explicit normalized style and ergonomics weights', () => {
    expect(parameters.styleWeight).toBe(0.7);
    expect(parameters.ergonomicsWeight).toBe(0.3);
    expect(parameters.styleWeight + parameters.ergonomicsWeight).toBe(1);
  });
});
