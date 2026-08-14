import ClearanceEvaluator from './ClearanceEvaluator.js';
import PassageZoneEvaluator from './PassageZoneEvaluator.js';

export class SpatialErgonomicsEvaluator {
  constructor(clearanceEvaluator = new ClearanceEvaluator(), passageZoneEvaluator = new PassageZoneEvaluator()) {
    if (!clearanceEvaluator || typeof clearanceEvaluator.evaluate !== 'function') {
      throw new Error('SpatialErgonomicsEvaluator requires clearanceEvaluator');
    }
    if (!passageZoneEvaluator || typeof passageZoneEvaluator.evaluate !== 'function') {
      throw new Error('SpatialErgonomicsEvaluator requires passageZoneEvaluator');
    }
    this.clearanceEvaluator = clearanceEvaluator;
    this.passageZoneEvaluator = passageZoneEvaluator;
    Object.freeze(this);
  }

  evaluate(roomState, rules = {}) {
    const clearanceViolations = rules.minimumClearance
      ? this.clearanceEvaluator.evaluate(roomState, rules.minimumClearance)
      : [];
    const passageViolations = Array.isArray(rules.passageZones) && rules.passageZones.length > 0
      ? this.passageZoneEvaluator.evaluate(roomState, rules.passageZones)
      : [];
    return [...clearanceViolations, ...passageViolations];
  }
}

export default SpatialErgonomicsEvaluator;
