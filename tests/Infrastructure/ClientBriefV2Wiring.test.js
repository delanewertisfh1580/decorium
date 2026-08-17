import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const mainSource = readFileSync(join(root, 'src/main.js'), 'utf8');
const schemaLoaderSource = readFileSync(join(root, 'src/Infrastructure/DataLoaders/SchemaLoader.js'), 'utf8');
const repositorySource = readFileSync(join(root, 'src/Infrastructure/Repositories/JsonClientBriefRepository.js'), 'utf8');

describe('ClientBrief V2 production wiring', () => {
  it('loads the V2 schema and catalog as the only bootstrap source for active client-priority evaluation input', () => {
    expect(schemaLoaderSource).toContain("./data/briefs/client-brief.v2.schema.json");
    expect(repositorySource).toContain("./data/briefs/client-briefs.v2.json");
    expect(mainSource).toContain("'./data/briefs/client-briefs.v2.json'");
    expect(mainSource).not.toContain("'./data/briefs/client-briefs.v1.json'");
  });
});
