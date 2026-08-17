import { describe, expect, it } from 'vitest';
import MultiChannelEvaluationExplanationAssembler from '../../../src/Application/Services/MultiChannelEvaluationExplanationAssembler.js';

describe('MultiChannelEvaluationExplanationAssembler', () => {
  it('serializes a client-priority violation as explanation V2 with authored remediation and exact multi-channel impact', async () => {
    const violation = {
      constraintId: 'client-priority:warm-intimacy', featureName: 'spatialPreferencePriority', operator: 'gte',
      threshold: 1, actualValue: 0.5, severity: 0.5, messageKey: 'priority-warm-intimacy',
      constraint: { description: 'Камерная атмосфера' }, critical: false, itemIds: []
    };
    const assembler = new MultiChannelEvaluationExplanationAssembler({
      violationImpactPolicy: {
        evaluate: () => ({
          impacts: [{
            violationId: 'client-priority:warm-intimacy', channel: 'client-priority',
            channelScoreDelta: 0.5, totalScoreDelta: 0.1, displayStarsDelta: 0, completionEffect: 'none'
          }]
        })
      },
      feedbackCatalog: {
        getViolationExplanation: async () => ({
          severity: 'medium',
          remediation: 'Сделайте пространство более собранным.'
        })
      }
    });

    const explanation = await assembler.assemble({
      roomState: { getItem: () => null },
      targetResults: [],
      compositionViolations: [],
      priorityResults: [{
        id: 'warm-intimacy', label: 'Камерная атмосфера', ruleKind: 'spatial-preferences', violation
      }],
      ergonomicsViolations: [],
      ratingPolicy: {},
      completion: { minimumStars: 3, criticalRuleMode: 'informational' },
      scorecard: { rawScore: 0.73, rawStars: 4, stars: 4, completionEligible: true, completionBlockReason: null }
    });

    expect(explanation).toEqual({
      schemaVersion: 2,
      scorecard: { rawScore: 0.73, rawStars: 4, displayStars: 4, completionEligible: true, completionBlockReason: null },
      violations: [{
        id: 'client-priority:warm-intimacy',
        channel: 'client-priority',
        scope: 'room',
        priority: { id: 'warm-intimacy', label: 'Камерная атмосфера', ruleKind: 'spatial-preferences' },
        rule: { messageKey: 'priority-warm-intimacy', description: 'Камерная атмосфера' },
        fact: { operator: 'gte', actual: 0.5, desired: 1 },
        severity: { level: 'medium', value: 0.5, critical: false },
        impact: { channelScoreDelta: 0.5, totalScoreDelta: 0.1, displayStarsDelta: 0, completionEffect: 'none' },
        remediation: 'Сделайте пространство более собранным.',
        instances: []
      }]
    });
  });
});
