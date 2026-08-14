import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = join(process.cwd(), '.github/workflows/release-gate.yml');

describe('PROD-006 release CI workflow', () => {
  it('runs deterministic release quality gates for pull requests and master updates', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('push:');
    expect(workflow).toContain('master');
    expect(workflow).toContain('npm ci');
    expect(workflow).toContain('npm test');
    expect(workflow).toContain('npm run build');
    expect(workflow).toContain('npm audit --omit=dev --audit-level=high');
  });

  it('validates and retains the generated release manifest together with a rollback-capable dist artifact', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('dist/release-manifest.json');
    expect(workflow).toContain('actions/upload-artifact@v4');
    expect(workflow).toContain('decorium-web-release');
    expect(workflow).toContain('retention-days: 14');
  });
});
