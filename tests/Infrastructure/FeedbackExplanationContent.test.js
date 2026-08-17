import { describe, expect, it } from 'vitest';
import clientBriefs from '../../data/briefs/client-briefs.v1.json';
import styleConstraints from '../../data/constraints/scandinavian-constraints.json';
import feedbackEntries from '../../data/feedback/scandinavian-feedback.json';

function collectMessageKeys(value, keys = new Set()) {
  if (Array.isArray(value)) {
    value.forEach(entry => collectMessageKeys(entry, keys));
    return keys;
  }
  if (!value || typeof value !== 'object') return keys;
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'messageKey' && typeof nested === 'string') keys.add(nested);
    else collectMessageKeys(nested, keys);
  }
  return keys;
}

describe('explainable feedback content coverage', () => {
  it('provides authored remediation and severity for every shipped style, composition and ClientBrief diagnostic', () => {
    const requiredKeys = new Set([
      ...styleConstraints.map(constraint => constraint.messageKey),
      ...collectMessageKeys(clientBriefs),
      'composition-too-few-items',
      'composition-missing-seating',
      'composition-missing-surface',
      'composition-missing-lighting',
      'composition-missing-storage',
      'composition-missing-decor',
      'ergonomics-minimum-clearance',
      'ergonomics-passage-zone-free'
    ]);
    const feedbackById = new Map(feedbackEntries.map(entry => [entry.id, entry]));

    for (const messageKey of requiredKeys) {
      const entry = feedbackById.get(messageKey);
      expect(entry, `Missing feedback entry for ${messageKey}`).toMatchObject({
        id: messageKey,
        category: 'violation'
      });
      expect(entry.template, `Missing remediation template for ${messageKey}`).toEqual(expect.any(String));
      expect(entry.template.trim(), `Blank remediation template for ${messageKey}`).not.toBe('');
      expect(entry.severity, `Missing severity for ${messageKey}`).toMatch(/^(low|medium|high)$/);
    }
  });
});
