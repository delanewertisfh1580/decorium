import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = process.cwd();
const activeDocuments = [
  'docs/README.md',
  'docs/product/overview.md',
  'docs/product/roadmap.md',
  'docs/architecture/overview.md',
  'docs/systems/content-model.md',
  'docs/operations/release-runbook.md'
];

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.isFile() && path.endsWith('.md') ? [path] : [];
  });
}

function localMarkdownTargets(path) {
  const source = readFileSync(path, 'utf8');
  const linkPattern = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  return [...source.matchAll(linkPattern)]
    .map(match => match[1].split('#')[0])
    .filter(target => target && !/^(https?:|mailto:)/.test(target) && target.endsWith('.md'));
}

describe('Documentation requirements', () => {
  it('keeps the project changelog and a single repository entry point', () => {
    expect(existsSync(join(ROOT, 'CHANGELOG.md'))).toBe(true);
    expect(existsSync(join(ROOT, 'README.md'))).toBe(true);

    const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
    expect(readme).toContain('docs/README.md');
  });

  it('keeps every active canonical guide in the compact documentation map', () => {
    for (const relativePath of activeDocuments) {
      expect(existsSync(join(ROOT, relativePath))).toBe(true);
    }
  });

  it('makes the documentation hub navigate product, architecture, content, operations, decisions and history', () => {
    const hubPath = join(ROOT, 'docs', 'README.md');
    if (!existsSync(hubPath)) expect.fail('docs/README.md not found');

    const hub = readFileSync(hubPath, 'utf8');
    for (const section of ['Продукт', 'Архитектура', 'Контент и геймплей', 'Операции', 'ADR', 'История']) {
      expect(hub).toContain(section);
    }
  });

  it('defines an active multi-style, client-brief-driven V2 production baseline', () => {
    const productOverview = readFileSync(join(ROOT, 'docs', 'product', 'overview.md'), 'utf8');
    const contentModel = readFileSync(join(ROOT, 'docs', 'systems', 'content-model.md'), 'utf8');

    expect(productOverview).toContain('мультистил');
    expect(productOverview).toContain('ClientBrief v2');
    expect(productOverview).toContain('50% style');
    expect(contentModel).toContain('ClientBrief v2');
    expect(contentModel).toContain('style-constraint-catalog.v1');
  });

  it('keeps every local Markdown link resolvable after documentation moves', () => {
    const files = [join(ROOT, 'README.md'), ...markdownFiles(join(ROOT, 'docs'))];
    const unresolved = files.flatMap(file => localMarkdownTargets(file)
      .filter(target => !existsSync(resolve(dirname(file), target)))
      .map(target => `${file.replace(`${ROOT}/`, '')} → ${target}`));

    expect(unresolved).toEqual([]);
  });
});
