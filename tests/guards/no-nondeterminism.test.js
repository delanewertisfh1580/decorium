import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const DOMAIN_PATH = join(process.cwd(), 'src', 'Domain');
const APPLICATION_PATH = join(process.cwd(), 'src', 'Application');

const NONDETERMINISTIC_PATTERNS = [
  /Math\.random\s*\(/,
  /Date\.now\s*\(/,
  /new\s+Date\s*\(/,
  /\bfetch\s*\(/,
  /localStorage\b/,
  /sessionStorage\b/
];

function getAllJsFiles(dir) {
  const files = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllJsFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Directory might not exist yet
  }
  return files;
}

describe('S13 Guard: No nondeterminism in Domain and Application', () => {
  it('Domain layer contains no nondeterministic calls', () => {
    const files = getAllJsFiles(DOMAIN_PATH);
    const violations = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const pattern of NONDETERMINISTIC_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          const relPath = relative(process.cwd(), file);
          violations.push(`${relPath}: ${pattern.source}`);
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(`Nondeterministic patterns found:\n${violations.join('\n')}`);
    }

    expect(violations).toHaveLength(0);
  });

  it('Application layer contains no nondeterministic calls', () => {
    const files = getAllJsFiles(APPLICATION_PATH);
    const violations = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      for (const pattern of NONDETERMINISTIC_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          const relPath = relative(process.cwd(), file);
          violations.push(`${relPath}: ${pattern.source}`);
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(`Nondeterministic patterns found:\n${violations.join('\n')}`);
    }

    expect(violations).toHaveLength(0);
  });
});
