import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const mainSource = readFileSync(join(root, 'src/main.js'), 'utf8');
const controllerSource = readFileSync(join(root, 'src/Presentation/Controllers/GameController.js'), 'utf8');

describe('ergonomics evaluation wiring', () => {
  it('constructs spatial, functional, scoring and aggregation dependencies in the composition root', () => {
    expect(mainSource).toContain('SpatialErgonomicsEvaluator');
    expect(mainSource).toContain('FunctionalLayoutEvaluator');
    expect(mainSource).toContain('new FunctionalLayoutEvaluator()');
    expect(mainSource).toContain('ErgonomicsScorer');
    expect(mainSource).toContain('EvaluationScoreAggregator');
  });

  it('passes active level ergonomics rules into the evaluation use case', () => {
    expect(controllerSource).toContain('this.level.ergonomicsRules');
  });
});
