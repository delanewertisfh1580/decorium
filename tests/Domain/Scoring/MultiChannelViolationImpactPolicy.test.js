import { describe, expect, it } from 'vitest';
import MultiChannelViolationImpactPolicy from '../../../src/Domain/Scoring/MultiChannelViolationImpactPolicy.js';
import ScorecardCalibrationPolicy from '../../../src/Domain/Scoring/ScorecardCalibrationPolicy.js';
import { StarRatingPolicy } from '../../../src/Domain/Scoring/StarRatingPolicy.js';
import { StyleScorer } from '../../../src/Domain/Scoring/StyleScorer.js';
import ErgonomicsScorer from '../../../src/Domain/Scoring/ErgonomicsScorer.js';
import StyleChannelPolicy from '../../../src/Domain/Scoring/StyleChannelPolicy.js';
import ThreeChannelScoreAggregator from '../../../src/Domain/Scoring/ThreeChannelScoreAggregator.js';

const priorityViolation = {
  constraintId: 'client-priority:warm-intimacy',
  severity: 0.5,
  constraint: { weight: 1 },
  critical: false
};

describe('MultiChannelViolationImpactPolicy', () => {
  it('recomputes exact priority recovery through the V2 score channels and calibrated stars', () => {
    const policy = new MultiChannelViolationImpactPolicy({
      styleScorer: new StyleScorer({ maxPenalty: 1, defaultWeight: 1 }),
      ergonomicsScorer: new ErgonomicsScorer({ maxPenalty: 1, defaultWeight: 1 }),
      styleChannelPolicy: new StyleChannelPolicy({ targetFitWeight: 0.75, compositionWeight: 0.25 }),
      threeChannelScoreAggregator: new ThreeChannelScoreAggregator({ styleWeight: 0.5, clientPriorityWeight: 0.2, ergonomicsWeight: 0.3 }),
      scorecardCalibrationPolicy: new ScorecardCalibrationPolicy({ schemaVersion: 1, criticalStarCap: 2 })
    });
    const ratingPolicy = new StarRatingPolicy({ '0': 0, '1': 0, '2': 0.4, '3': 0.56, '4': 0.71, '5': 0.86 });

    const result = policy.evaluate({
      targetResults: [{ styleId: 'scandinavian', weight: 1, violations: [] }],
      compositionViolations: [],
      priorityResults: [{ id: 'warm-intimacy', weight: 1, satisfaction: 0.5, violation: priorityViolation }],
      ergonomicsViolations: [],
      ratingPolicy,
      completion: { minimumStars: 3, criticalRuleMode: 'informational' }
    });

    expect(result.current).toMatchObject({ styleScore: 1, clientPriorityScore: 0.5, ergonomicsScore: 1, totalScore: 0.9, stars: 5 });
    expect(result.impacts).toEqual([{
      violationId: 'client-priority:warm-intimacy',
      channel: 'client-priority',
      channelScoreDelta: 0.5,
      totalScoreDelta: 0.1,
      displayStarsDelta: 0,
      completionEffect: 'none'
    }]);
  });
});
