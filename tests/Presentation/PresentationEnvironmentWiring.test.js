import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const mainSource = readFileSync(join(process.cwd(), 'src/main.js'), 'utf8');
const schemaLoaderSource = readFileSync(join(process.cwd(), 'src/Infrastructure/DataLoaders/SchemaLoader.js'), 'utf8');

describe('presentation environment production wiring', () => {
  it('loads the versioned profile schema and injects a validated repository into LoadLevelUseCase', () => {
    expect(schemaLoaderSource).toContain('loadPresentationEnvironmentSchema');
    expect(mainSource).toContain('JsonPresentationEnvironmentRepository');
    expect(mainSource).toContain('SchemaLoader.loadPresentationEnvironmentSchema()');
    expect(mainSource).toContain('new JsonPresentationEnvironmentRepository(');
    expect(mainSource).toContain("'./data/presentation/environment-profiles.v2.json'");
    expect(mainSource).toContain('presentationEnvironmentSchema');
    expect(mainSource).toContain('new LoadLevelUseCase(');
    expect(schemaLoaderSource).toContain('loadClientBriefSchema');
    expect(mainSource).toContain('JsonClientBriefRepository');
    expect(mainSource).toContain('SchemaLoader.loadClientBriefSchema()');
    expect(mainSource).toContain("'./data/briefs/client-briefs.v1.json'");
    expect(mainSource).toContain('clientBriefRepository');
  });
});
