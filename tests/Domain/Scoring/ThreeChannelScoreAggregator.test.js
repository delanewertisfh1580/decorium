import { describe, expect, it } from 'vitest';
import ThreeChannelScoreAggregator from '../../../src/Domain/Scoring/ThreeChannelScoreAggregator.js';

describe('ThreeChannelScoreAggregator', () => {
  it('combines style, client-priority and ergonomics scores through normalized authored V2 weights', () => {
    const aggregator = new ThreeChannelScoreAggregator({
      styleWeight: 0.5,
      clientPriorityWeight: 0.2,
      ergonomicsWeight: 0.3
    });

    expect(aggregator.aggregate({
      styleScore: 0.8,
      clientPriorityScore: 0.5,
      ergonomicsScore: 0.9
    })).toEqual({
      totalScore: 0.77,
      styleWeight: 0.5,
      clientPriorityWeight: 0.2,
      ergonomicsWeight: 0.3
    });
  });

  it('rejects a missing client-priority channel instead of silently restoring the old 70/30 aggregate', () => {
    const aggregator = new ThreeChannelScoreAggregator({
      styleWeight: 0.5,
      clientPriorityWeight: 0.2,
      ergonomicsWeight: 0.3
    });

    expect(() => aggregator.aggregate({ styleScore: 0.8, ergonomicsScore: 0.9 }))
      .toThrow('ThreeChannelScoreAggregator clientPriorityScore must be between 0 and 1');
  });
});
