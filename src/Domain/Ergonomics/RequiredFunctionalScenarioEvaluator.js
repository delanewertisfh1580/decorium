import RequiredFunctionalScenario from './RequiredFunctionalScenario.js';

function matchesAffordance(placedItem, affordance) {
  return placedItem.item.interactionProfile.hasAffordance(affordance);
}

class RequiredFunctionalScenarioViolation {
  constructor(scenario, role, matchingItems) {
    this._scenario = scenario;
    this._role = role;
    this._itemIds = Object.freeze(matchingItems.map(item => item.id).sort());
    this._actualValue = matchingItems.length;
    this._severity = Math.min(1, Math.max(0, (role.minCount - this._actualValue) / role.minCount));
    Object.freeze(this);
  }

  get constraint() {
    return Object.freeze({
      id: this.constraintId,
      weight: this._scenario.weight,
      description: 'Клиентская функциональная группа неполна.'
    });
  }

  get constraintId() { return `required-scenario:${this._scenario.id}:${this._role.affordance}`; }
  get featureName() { return 'requiredFunctionalScenario'; }
  get operator() { return '>='; }
  get threshold() { return this._role.minCount; }
  get actualValue() { return this._actualValue; }
  get severity() { return this._severity; }
  get messageKey() { return this._scenario.messageKey; }
  get itemIds() { return this._itemIds; }
  get critical() { return this._scenario.critical; }

  toJSON() {
    return {
      id: this.constraintId,
      feature: this.featureName,
      operator: this.operator,
      threshold: this.threshold,
      actualValue: this.actualValue,
      severity: this.severity,
      messageKey: this.messageKey,
      itemIds: [...this.itemIds],
      critical: this.critical
    };
  }
}

export class RequiredFunctionalScenarioEvaluator {
  evaluate(roomState, scenarios) {
    if (!roomState || typeof roomState.getItems !== 'function') {
      throw new Error('RequiredFunctionalScenarioEvaluator requires RoomState');
    }
    if (!Array.isArray(scenarios) || !scenarios.every(scenario => scenario instanceof RequiredFunctionalScenario)) {
      throw new Error('RequiredFunctionalScenarioEvaluator requires RequiredFunctionalScenario array');
    }

    const placedItems = roomState.getItems();
    const violations = [];
    for (const scenario of scenarios) {
      for (const role of scenario.requiredRoles) {
        const matchingItems = placedItems.filter(item => matchesAffordance(item, role.affordance));
        if (matchingItems.length < role.minCount) {
          violations.push(new RequiredFunctionalScenarioViolation(scenario, role, matchingItems));
        }
      }
    }
    return Object.freeze(violations);
  }
}

export default RequiredFunctionalScenarioEvaluator;
