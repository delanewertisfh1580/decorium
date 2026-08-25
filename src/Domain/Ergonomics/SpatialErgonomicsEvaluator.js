import ClearanceEvaluator from './ClearanceEvaluator.js';
import PassageZoneEvaluator from './PassageZoneEvaluator.js';
import FunctionalLayoutEvaluator from './FunctionalLayoutEvaluator.js';
import RequiredFunctionalScenarioEvaluator from './RequiredFunctionalScenarioEvaluator.js';

/**
 * Expands validated functional pairs into full functional clusters.
 * Items inside one cluster belong to a single authored furniture group
 * (for example a dining table with its seats), therefore the generic
 * pairwise clearance rule must not punish them against each other.
 * Returns every unordered pair of instance ids within each cluster.
 */
export function expandFunctionalClusters(matchedPairs) {
  const parent = new Map();
  function find(itemId) {
    if (!parent.has(itemId)) parent.set(itemId, itemId);
    let root = itemId;
    while (parent.get(root) !== root) root = parent.get(root);
    let current = itemId;
    while (parent.get(current) !== current) {
      const next = parent.get(current);
      parent.set(current, root);
      current = next;
    }
    return root;
  }
  function union(leftItemId, rightItemId) {
    const leftRoot = find(leftItemId);
    const rightRoot = find(rightItemId);
    if (leftRoot !== rightRoot) parent.set(leftRoot, rightRoot);
  }

  for (const [leftItemId, rightItemId] of matchedPairs) union(leftItemId, rightItemId);

  const membersByRoot = new Map();
  for (const itemId of parent.keys()) {
    const root = find(itemId);
    if (!membersByRoot.has(root)) membersByRoot.set(root, []);
    membersByRoot.get(root).push(itemId);
  }

  const exemptPairs = [];
  for (const members of membersByRoot.values()) {
    for (let leftIndex = 0; leftIndex < members.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < members.length; rightIndex += 1) {
        exemptPairs.push([members[leftIndex], members[rightIndex]]);
      }
    }
  }
  return exemptPairs;
}

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
        excludedPairs: expandFunctionalClusters(functionalResult.matchedPairs)
      })
      : [];
    const passageViolations = Array.isArray(rules.passageZones) && rules.passageZones.length > 0
      ? this.passageZoneEvaluator.evaluate(roomState, rules.passageZones)
      : [];
    return [...requiredScenarioViolations, ...functionalResult.violations, ...clearanceViolations, ...passageViolations];
  }
}

export default SpatialErgonomicsEvaluator;
