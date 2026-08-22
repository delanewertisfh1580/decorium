import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const mainSource = readFileSync(join(root, 'src/main.js'), 'utf8');
const schemaLoaderSource = readFileSync(join(root, 'src/Infrastructure/DataLoaders/SchemaLoader.js'), 'utf8');
const evaluationCoordinatorSource = readFileSync(join(root, 'src/Presentation/Controllers/EvaluationCoordinator.js'), 'utf8');

describe('PROD-023 production evaluation wiring', () => {
  it('constructs V2 style, spatial and client-priority scoring collaborators from versioned content', () => {
    expect(schemaLoaderSource).toContain('loadStyleConstraintCatalogSchema');
    expect(mainSource).toContain("'./data/styles/style-constraint-catalog.v1.json'");
    expect(mainSource).toContain('MultiStyleEvaluator');
    expect(mainSource).toContain('StyleChannelPolicy');
    expect(mainSource).toContain('RoomOccupancyProfile');
    expect(mainSource).toContain('SpatialPreferenceEvaluator');
    expect(mainSource).toContain('ClientPriorityEvaluator');
    expect(mainSource).toContain('ThreeChannelScoreAggregator');
    expect(mainSource).toContain('MultiChannelViolationImpactPolicy');
    expect(mainSource).toContain('multiChannelViolationImpactPolicy');
    expect(mainSource).toContain('multiStyleDependencies');
    expect(mainSource).toContain('schemaVersion: 1,');
  });

  it('forwards the immutable level evaluationSpec through the evaluation coordinator without deriving scoring inputs in Presentation', () => {
    expect(evaluationCoordinatorSource).toContain('level.evaluationSpec');
  });
});
