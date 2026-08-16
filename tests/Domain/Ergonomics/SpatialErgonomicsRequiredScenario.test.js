import { describe, expect, it } from 'vitest';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import RequiredFunctionalScenario from '../../../src/Domain/Ergonomics/RequiredFunctionalScenario.js';
import RequiredFunctionalScenarioEvaluator from '../../../src/Domain/Ergonomics/RequiredFunctionalScenarioEvaluator.js';
import SpatialErgonomicsEvaluator from '../../../src/Domain/Ergonomics/SpatialErgonomicsEvaluator.js';

describe('SpatialErgonomicsEvaluator required scenarios', () => {
  it('includes a critical missing media-group violation when no media anchors have been placed', () => {
    const room = RoomState.createEmpty(new RoomBounds(6, 5));
    const mediaScenario = new RequiredFunctionalScenario({
      schemaVersion: 1,
      id: 'evening-media',
      label: 'Медиа-зона',
      requiredRoles: [
        { affordance: 'lounge-seat', minCount: 1 },
        { affordance: 'view-target', minCount: 1 },
        { affordance: 'coffee-surface', minCount: 1 }
      ],
      weight: 1.3,
      critical: true,
      messageKey: 'scenario-evening-media-required'
    });
    const evaluator = new SpatialErgonomicsEvaluator(
      undefined,
      undefined,
      undefined,
      new RequiredFunctionalScenarioEvaluator()
    );

    const violations = evaluator.evaluate(room, { requiredFunctionalScenarios: [mediaScenario] });

    expect(violations).toHaveLength(3);
    expect(violations.map(violation => violation.constraintId)).toEqual([
      'required-scenario:evening-media:lounge-seat',
      'required-scenario:evening-media:view-target',
      'required-scenario:evening-media:coffee-surface'
    ]);
    expect(violations.every(violation => violation.critical)).toBe(true);
  });
});
