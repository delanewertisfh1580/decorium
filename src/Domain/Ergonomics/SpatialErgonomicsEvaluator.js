import ClearanceEvaluator from './ClearanceEvaluator.js';
import PassageZoneEvaluator from './PassageZoneEvaluator.js';
import FunctionalLayoutEvaluator from './FunctionalLayoutEvaluator.js';

export class SpatialErgonomicsEvaluator {
  constructor(
    clearanceEvaluator = new ClearanceEvaluator(),
    passageZoneEvaluator = new PassageZoneEvaluator(),
    functionalLayoutEvaluator = new FunctionalLayoutEvaluator()
  ) {
    if (!clearanceEvaluator || typeof clearanceEvaluator.evaluate !== 'function') {
      throw new Error('SpatialErgonomicsEvaluator requires clearanceEvaluator');
    }
    if (!passageZoneEvaluator || typeof passageZoneEvaluator.evaluate !== 'function') {
      throw new Error('SpatialErgonomicsEvaluator requires passageZoneEvaluator');
    }
    if (!functionalLayoutEvaluator || typeof functionalLayoutEvaluator.evaluate !== 'function') {
      throw new Error('SpatialErgonomicsEvaluator requires functionalLayoutEvaluator');
    }
    this.clearanceEvaluator = clearanceEvaluator;
    this.passageZoneEvaluator = passageZoneEvaluator;
    this.functionalLayoutEvaluator = functionalLayoutEvaluator;
    Object.freeze(this);
  }

  evaluate(roomState, rules = {}) {
    const functionalResult = Array.isArray(rules.functionalLayoutRules) && rules.functionalLayoutRules.length > 0
      ? this.functionalLayoutEvaluator.evaluate(roomState, rules.functionalLayoutRules)
      : { violations: [], matchedPairs: [] };
    const clearanceViolations = rules.minimumClearance
      ? this.clearanceEvaluator.evaluate(roomState, rules.minimumClearance, {
        excludedPairs: functionalResult.matchedPairs
      })
      : [];
    const passageViolations = Array.isArray(rules.passageZones) && rules.passageZones.length > 0
      ? this.passageZoneEvaluator.evaluate(roomState, rules.passageZones)
      : [];
    return [...functionalResult.violations, ...clearanceViolations, ...passageViolations];
  }
}

export default SpatialErgonomicsEvaluator;
