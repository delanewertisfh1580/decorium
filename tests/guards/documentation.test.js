import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(process.cwd());

describe('Documentation Requirements', () => {
  it('should have decomposition.md in docs/', () => {
    const path = join(ROOT, 'docs', 'decomposition.md');
    expect(existsSync(path)).toBe(true);
  });

  it('should have CHANGELOG.md in root', () => {
    const path = join(ROOT, 'CHANGELOG.md');
    expect(existsSync(path)).toBe(true);
  });

  it('should have README.md in root', () => {
    const path = join(ROOT, 'README.md');
    expect(existsSync(path)).toBe(true);
  });

  it('decomposition.md should contain required sections 1-9', () => {
    const path = join(ROOT, 'docs', 'decomposition.md');
    if (!existsSync(path)) {
      expect.fail('decomposition.md not found');
    }
    const content = readFileSync(path, 'utf-8');
    const requiredSections = [
      '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.'
    ];
    requiredSections.forEach(section => {
      expect(content).toContain(section);
    });
  });
});
