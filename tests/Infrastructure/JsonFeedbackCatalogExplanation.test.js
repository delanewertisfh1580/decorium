import { afterEach, describe, expect, it, vi } from 'vitest';
import JsonFeedbackCatalog from '../../src/Infrastructure/DataLoaders/JsonFeedbackCatalog.js';

afterEach(() => vi.restoreAllMocks());

describe('JsonFeedbackCatalog explanation metadata', () => {
  it('returns formatted authored remediation and severity for a violation message key', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [{
        id: 'ergonomics-minimum-clearance',
        category: 'violation',
        severity: 'high',
        template: 'Оставьте больше прохода: нужно минимум {threshold} м, сейчас {value} м.'
      }]
    })));
    const catalog = new JsonFeedbackCatalog('/feedback.json');

    const explanation = await catalog.getViolationExplanation('ergonomics-minimum-clearance', {
      threshold: 0.8,
      value: 0.3
    });

    expect(explanation).toEqual({
      messageKey: 'ergonomics-minimum-clearance',
      severity: 'high',
      remediation: 'Оставьте больше прохода: нужно минимум 0.8 м, сейчас 0.3 м.'
    });
  });

  it('returns null for an unknown message key instead of inventing authored remediation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] })));
    const catalog = new JsonFeedbackCatalog('/feedback.json');

    await expect(catalog.getViolationExplanation('unknown-rule')).resolves.toBeNull();
  });
});
