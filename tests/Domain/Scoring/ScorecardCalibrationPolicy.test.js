import { describe, expect, it } from 'vitest';
import { StarRatingPolicy } from '../../../src/Domain/Scoring/StarRatingPolicy.js';
import ScorecardCalibrationPolicy from '../../../src/Domain/Scoring/ScorecardCalibrationPolicy.js';

const ratingPolicy = new StarRatingPolicy({
  0: 0,
  1: 0,
  2: 0.4,
  3: 0.56,
  4: 0.71,
  5: 0.86
});

const criticalScenarioViolation = Object.freeze({
  diagnosticId: 'required-scenario:evening-media:view-target',
  constraintId: 'required-scenario:evening-media:view-target',
  critical: true,
  type: 'ergonomics'
});

describe('ScorecardCalibrationPolicy', () => {
  it('caps a perfect raw rating below the brief completion target and blocks completion for critical-rule block mode', () => {
    const scorecard = new ScorecardCalibrationPolicy({ schemaVersion: 1, criticalStarCap: 2 });

    const result = scorecard.evaluate({
      totalScore: 0.91,
      styleScore: 1,
      ergonomicsScore: 0.7,
      ratingPolicy,
      completion: { minimumStars: 3, criticalRuleMode: 'block-completion' },
      violations: [criticalScenarioViolation]
    });

    expect(result).toEqual({
      rawScore: 0.91,
      rawStars: 5,
      stars: 2,
      nextThreshold: 0.56,
      completionEligible: false,
      completionBlockReason: 'critical-rule',
      criticalViolationIds: ['required-scenario:evening-media:view-target']
    });
  });

  it('preserves distinct critical facts that share one authored constraint', () => {
    const scorecard = new ScorecardCalibrationPolicy({ schemaVersion: 1, criticalStarCap: 2 });

    const result = scorecard.evaluate({
      totalScore: 0.91,
      ratingPolicy,
      completion: { minimumStars: 3, criticalRuleMode: 'block-completion' },
      violations: [
        { ...criticalScenarioViolation, diagnosticId: 'required-scenario:evening-media:view-target:chair-001#1' },
        { ...criticalScenarioViolation, diagnosticId: 'required-scenario:evening-media:view-target:chair-002#1' }
      ]
    });

    expect(result.criticalViolationIds).toEqual([
      'required-scenario:evening-media:view-target:chair-001#1',
      'required-scenario:evening-media:view-target:chair-002#1'
    ]);
  });

  it('retains normal star and completion behavior when no critical diagnostics exist', () => {
    const scorecard = new ScorecardCalibrationPolicy({ schemaVersion: 1, criticalStarCap: 2 });

    const result = scorecard.evaluate({
      totalScore: 0.72,
      styleScore: 0.8,
      ergonomicsScore: 0.55,
      ratingPolicy,
      completion: { minimumStars: 4, criticalRuleMode: 'block-completion' },
      violations: []
    });

    expect(result).toEqual({
      rawScore: 0.72,
      rawStars: 4,
      stars: 4,
      nextThreshold: 0.86,
      completionEligible: true,
      completionBlockReason: null,
      criticalViolationIds: []
    });
  });

  it('keeps informational critical diagnostics visible without reducing the rating or eligibility', () => {
    const scorecard = new ScorecardCalibrationPolicy({ schemaVersion: 1, criticalStarCap: 2 });

    const result = scorecard.evaluate({
      totalScore: 0.91,
      styleScore: 1,
      ergonomicsScore: 0.7,
      ratingPolicy,
      completion: { minimumStars: 3, criticalRuleMode: 'informational' },
      violations: [criticalScenarioViolation]
    });

    expect(result).toMatchObject({
      rawStars: 5,
      stars: 5,
      completionEligible: true,
      completionBlockReason: null,
      criticalViolationIds: ['required-scenario:evening-media:view-target']
    });
  });
});
