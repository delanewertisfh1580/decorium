import { describe, expect, it } from 'vitest';
import ErgonomicsScorer from '../../../src/Domain/Scoring/ErgonomicsScorer.js';
import EvaluationScoreAggregator from '../../../src/Domain/Scoring/EvaluationScoreAggregator.js';
import ScorecardCalibrationPolicy from '../../../src/Domain/Scoring/ScorecardCalibrationPolicy.js';
import { StarRatingPolicy } from '../../../src/Domain/Scoring/StarRatingPolicy.js';
import { StyleScorer } from '../../../src/Domain/Scoring/StyleScorer.js';
import ViolationImpactPolicy from '../../../src/Domain/Scoring/ViolationImpactPolicy.js';

const ratingPolicy = new StarRatingPolicy({
  0: 0,
  1: 0,
  2: 0.4,
  3: 0.56,
  4: 0.71,
  5: 0.86
});

const completion = Object.freeze({ minimumStars: 3, criticalRuleMode: 'block-completion' });

const styleWoodViolation = Object.freeze({
  constraintId: 'scand-wood-low',
  severity: 0.3,
  critical: false,
  constraint: Object.freeze({ weight: 1 })
});

const styleFormViolation = Object.freeze({
  constraintId: 'scand-form-complex',
  severity: 0.2,
  critical: false,
  constraint: Object.freeze({ weight: 1 })
});

describe('ViolationImpactPolicy', () => {
  it('reports the exact counterfactual recovery from correcting one style violation without mutating current diagnostics', () => {
    const policy = new ViolationImpactPolicy({
      styleScorer: new StyleScorer({ maxPenalty: 1, defaultWeight: 1 }),
      ergonomicsScorer: new ErgonomicsScorer({ maxPenalty: 1, defaultWeight: 1 }),
      scoreAggregator: new EvaluationScoreAggregator({ styleWeight: 0.7, ergonomicsWeight: 0.3 }),
      scorecardCalibrationPolicy: new ScorecardCalibrationPolicy({ schemaVersion: 1, criticalStarCap: 2 })
    });
    const styleViolations = Object.freeze([styleWoodViolation, styleFormViolation]);
    const ergonomicsViolations = Object.freeze([]);

    const impact = policy.evaluate({
      styleViolations,
      ergonomicsViolations,
      ratingPolicy,
      completion
    });

    expect(impact).toMatchObject({
      current: {
        styleScore: 0.5,
        ergonomicsScore: 1,
        totalScore: 0.65,
        stars: 3,
        completionEligible: true
      },
      impacts: [
        {
          violationId: 'scand-wood-low',
          channel: 'style',
          channelScoreDelta: 0.3,
          totalScoreDelta: 0.21,
          displayStarsDelta: 2,
          completionEffect: 'none'
        },
        {
          violationId: 'scand-form-complex',
          channel: 'style',
          channelScoreDelta: 0.2,
          totalScoreDelta: 0.14,
          displayStarsDelta: 1,
          completionEffect: 'none'
        }
      ]
    });
    expect(styleViolations).toEqual([styleWoodViolation, styleFormViolation]);
    expect(ergonomicsViolations).toEqual([]);
  });

  it('reports that correcting the final critical diagnostic restores gated completion', () => {
    const policy = new ViolationImpactPolicy({
      styleScorer: new StyleScorer({ maxPenalty: 1, defaultWeight: 1 }),
      ergonomicsScorer: new ErgonomicsScorer({ maxPenalty: 1, defaultWeight: 1 }),
      scoreAggregator: new EvaluationScoreAggregator({ styleWeight: 0.7, ergonomicsWeight: 0.3 }),
      scorecardCalibrationPolicy: new ScorecardCalibrationPolicy({ schemaVersion: 1, criticalStarCap: 2 })
    });
    const criticalScenarioViolation = Object.freeze({
      constraintId: 'required-scenario:evening-media:view-target',
      severity: 0.5,
      critical: true,
      constraint: Object.freeze({ weight: 1 })
    });

    const impact = policy.evaluate({
      styleViolations: Object.freeze([]),
      ergonomicsViolations: Object.freeze([criticalScenarioViolation]),
      ratingPolicy,
      completion
    });

    expect(impact.current).toMatchObject({
      styleScore: 1,
      ergonomicsScore: Math.exp(-0.5),
      totalScore: 0.881959197914,
      stars: 2,
      completionEligible: false
    });
    expect(impact.impacts).toEqual([{
      violationId: 'required-scenario:evening-media:view-target',
      channel: 'ergonomics',
      channelScoreDelta: 0.393469340287,
      totalScoreDelta: 0.118040802086,
      displayStarsDelta: 3,
      completionEffect: 'restores-completion'
    }]);
  });
});
