import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd());
const schemaPath = resolve(root, 'data/briefs/client-brief.v2.schema.json');
const catalogPath = resolve(root, 'data/briefs/client-briefs.v2.json');

describe('PROD-023 ClientBrief V2 content', () => {
  it('ships schema-valid V2 briefs whose priorities have explicit versioned evaluation rules', () => {
    expect(existsSync(schemaPath)).toBe(true);
    expect(existsSync(catalogPath)).toBe(true);
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
    const validate = new Ajv().compile(schema);

    expect(validate(catalog)).toBe(true);
    expect(catalog.schemaVersion).toBe(2);
    expect(catalog.briefs).toHaveLength(3);
    for (const brief of catalog.briefs) {
      expect(brief.schemaVersion).toBe(2);
      for (const priority of brief.clientPriorities) {
        expect(priority.rule).toMatchObject({ schemaVersion: 1, messageKey: expect.any(String) });
        expect(['functional-scenario', 'spatial-preferences']).toContain(priority.rule.kind);
      }
    }
  });
});
