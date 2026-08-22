import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd());
const briefs = JSON.parse(readFileSync(resolve(root, 'data/briefs/client-briefs.v3.json'), 'utf8'));
const feedback = JSON.parse(readFileSync(resolve(root, 'data/feedback/scandinavian-feedback.json'), 'utf8'));

describe('PROD-023 client-priority feedback content', () => {
  it('maps every explicit V3 priority rule message key to authored violation remediation', () => {
    const feedbackById = new Map(feedback.map(entry => [entry.id, entry]));
    for (const brief of briefs.briefs) {
      for (const priority of brief.clientPriorities) {
        const entry = feedbackById.get(priority.rule.messageKey);
        expect(entry, `Missing feedback for ${brief.id}/${priority.id}`).toMatchObject({
          id: priority.rule.messageKey,
          category: 'violation'
        });
        expect(entry.severity).toMatch(/^(low|medium|high)$/);
        expect(entry.template.trim()).not.toBe('');
      }
    }
  });
});
