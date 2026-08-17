import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd());
const styles = JSON.parse(readFileSync(resolve(root, 'data/styles/style-constraint-catalog.v1.json'), 'utf8'));
const feedback = JSON.parse(readFileSync(resolve(root, 'data/feedback/scandinavian-feedback.json'), 'utf8'));

describe('PROD-023 multi-style feedback content', () => {
  it('provides authored violation feedback for every profile constraint message key', () => {
    const feedbackById = new Map(feedback.map(entry => [entry.id, entry]));
    for (const profile of styles.profiles) {
      for (const constraint of profile.constraints) {
        const entry = feedbackById.get(constraint.messageKey);
        expect(entry, `Missing feedback for ${profile.id}/${constraint.id}`).toMatchObject({
          id: constraint.messageKey,
          category: 'violation'
        });
        expect(entry.severity).toMatch(/^(low|medium|high)$/);
        expect(entry.template.trim()).not.toBe('');
      }
    }
  });
});
