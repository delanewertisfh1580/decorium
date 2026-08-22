import { describe, expect, it } from 'vitest';
import MultiChannelEvaluationExplanationAssembler from '../../../src/Application/Services/MultiChannelEvaluationExplanationAssembler.js';

describe('MultiChannelEvaluationExplanationAssembler', () => {
  it('serializes a client-priority violation as explanation V2 with authored remediation and exact multi-channel impact', async () => {
    const violation = {
      diagnosticId: 'client-priority:warm-intimacy', constraintId: 'client-priority:warm-intimacy', featureName: 'spatialPreferencePriority', operator: 'gte',
      threshold: 1, actualValue: 0.5, severity: 0.5, messageKey: 'priority-warm-intimacy',
      constraint: { description: 'Камерная атмосфера' }, critical: false, itemIds: []
    };
    const assembler = new MultiChannelEvaluationExplanationAssembler({
      violationImpactPolicy: {
        evaluate: () => ({
          impacts: [{
            diagnosticId: 'client-priority:warm-intimacy', channel: 'client-priority',
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
        constraintId: 'client-priority:warm-intimacy',
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

  it('keeps distinct impacts when two diagnostics originate from the same rule', async () => {
    const first = {
      diagnosticId: 'ergonomics:minimum-clearance:chair-a:table-a',
      constraintId: 'ergonomics-minimum-clearance', featureName: 'minimumClearance', operator: 'gte',
      threshold: 0.9, actualValue: 0.1, severity: 0.8, messageKey: 'ergonomics-minimum-clearance',
      constraint: { description: 'Недостаточный проход.' }, critical: false, itemIds: ['chair-a', 'table-a']
    };
    const second = {
      diagnosticId: 'ergonomics:minimum-clearance:chair-b:table-b',
      constraintId: 'ergonomics-minimum-clearance', featureName: 'minimumClearance', operator: 'gte',
      threshold: 0.9, actualValue: 0.5, severity: 0.4, messageKey: 'ergonomics-minimum-clearance',
      constraint: { description: 'Недостаточный проход.' }, critical: false, itemIds: ['chair-b', 'table-b']
    };
    const assembler = new MultiChannelEvaluationExplanationAssembler({
      violationImpactPolicy: {
        evaluate: () => ({
          impacts: [
            { diagnosticId: first.diagnosticId, channelScoreDelta: 0.3, totalScoreDelta: 0.09, displayStarsDelta: 1, completionEffect: 'none' },
            { diagnosticId: second.diagnosticId, channelScoreDelta: 0.1, totalScoreDelta: 0.03, displayStarsDelta: 0, completionEffect: 'none' }
          ]
        })
      },
      feedbackCatalog: { getViolationExplanation: async () => ({ severity: 'high', remediation: 'Освободите проход.' }) }
    });

    const explanation = await assembler.assemble({
      roomState: { getItem: instanceId => ({ id: instanceId, itemId: instanceId, item: { name: instanceId } }) },
      targetResults: [], compositionViolations: [], priorityResults: [], ergonomicsViolations: [first, second],
      ratingPolicy: {}, completion: { minimumStars: 3, criticalRuleMode: 'informational' },
      scorecard: { rawScore: 0.6, rawStars: 3, stars: 3, completionEligible: true, completionBlockReason: null }
    });

    expect(explanation.violations.map(violation => ({ id: violation.id, totalScoreDelta: violation.impact.totalScoreDelta }))).toEqual([
      { id: first.diagnosticId, totalScoreDelta: 0.09 },
      { id: second.diagnosticId, totalScoreDelta: 0.03 }
    ]);
  });
});
