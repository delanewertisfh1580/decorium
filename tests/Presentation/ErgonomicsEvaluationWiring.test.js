import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const mainSource = readFileSync(join(root, 'src/main.js'), 'utf8');
const controllerSource = readFileSync(join(root, 'src/Presentation/Controllers/GameController.js'), 'utf8');

describe('ergonomics evaluation wiring', () => {
  it('constructs spatial, functional and three-channel scoring dependencies in the composition root', () => {
    expect(mainSource).toContain('SpatialErgonomicsEvaluator');
    expect(mainSource).toContain('FunctionalLayoutEvaluator');
    expect(mainSource).toContain('new FunctionalLayoutEvaluator()');
    expect(mainSource).toContain('ErgonomicsScorer');
    expect(mainSource).toContain('ThreeChannelScoreAggregator');
    expect(mainSource).toContain('MultiChannelViolationImpactPolicy');
  });

  it('passes immutable EvaluationSpec into the V2 evaluation use case', () => {
    expect(controllerSource).toContain('evaluationSpec: this.level.evaluationSpec');
  });
});
