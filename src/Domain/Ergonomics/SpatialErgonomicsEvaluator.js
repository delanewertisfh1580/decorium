import ClearanceEvaluator from './ClearanceEvaluator.js';
import PassageZoneEvaluator from './PassageZoneEvaluator.js';
import FunctionalLayoutEvaluator from './FunctionalLayoutEvaluator.js';
import RequiredFunctionalScenarioEvaluator from './RequiredFunctionalScenarioEvaluator.js';

export class SpatialErgonomicsEvaluator {
  constructor(
    clearanceEvaluator = new ClearanceEvaluator(),
    passageZoneEvaluator = new PassageZoneEvaluator(),
    functionalLayoutEvaluator = new FunctionalLayoutEvaluator(),
    requiredFunctionalScenarioEvaluator = new RequiredFunctionalScenarioEvaluator()
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
    if (!requiredFunctionalScenarioEvaluator || typeof requiredFunctionalScenarioEvaluator.evaluate !== 'function') {
      throw new Error('SpatialErgonomicsEvaluator requires requiredFunctionalScenarioEvaluator');
    }
    this.clearanceEvaluator = clearanceEvaluator;
    this.passageZoneEvaluator = passageZoneEvaluator;
    this.functionalLayoutEvaluator = functionalLayoutEvaluator;
    this.requiredFunctionalScenarioEvaluator = requiredFunctionalScenarioEvaluator;
    Object.freeze(this);
  }

  evaluate(roomState, rules = {}) {
    const requiredScenarioViolations = Array.isArray(rules.requiredFunctionalScenarios) && rules.requiredFunctionalScenarios.length > 0
      ? this.requiredFunctionalScenarioEvaluator.evaluate(roomState, rules.requiredFunctionalScenarios)
      : [];
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
    return [...requiredScenarioViolations, ...functionalResult.violations, ...clearanceViolations, ...passageViolations];
  }
}

export default SpatialErgonomicsEvaluator;
