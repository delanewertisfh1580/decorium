import MinimumClearanceRule from './MinimumClearanceRule.js';

function dimensionsFor(placedItem) {
  const dimensions = placedItem.dimensions ?? { x: 1, z: 1 };
  return placedItem.rotation % 180 === 0
    ? dimensions
    : { x: dimensions.z, z: dimensions.x };
}

function intervalGap(minA, maxA, minB, maxB) {
  if (maxA < minB) return minB - maxA;
  if (maxB < minA) return minA - maxB;
  return 0;
}

function canonicalPairKey(leftItemId, rightItemId) {
  return [leftItemId, rightItemId].sort().join(':');
}

function footprintGap(left, right) {
  const leftDimensions = dimensionsFor(left);
  const rightDimensions = dimensionsFor(right);
  const leftXMin = left.position.x - leftDimensions.x / 2;
  const leftXMax = left.position.x + leftDimensions.x / 2;
  const leftZMin = left.position.z - leftDimensions.z / 2;
  const leftZMax = left.position.z + leftDimensions.z / 2;
  const rightXMin = right.position.x - rightDimensions.x / 2;
  const rightXMax = right.position.x + rightDimensions.x / 2;
  const rightZMin = right.position.z - rightDimensions.z / 2;
  const rightZMax = right.position.z + rightDimensions.z / 2;

  return Math.hypot(
    intervalGap(leftXMin, leftXMax, rightXMin, rightXMax),
    intervalGap(leftZMin, leftZMax, rightZMin, rightZMax)
  );
}

class ClearanceViolation {
  constructor(rule, leftItem, rightItem, actualValue) {
    this._rule = rule;
    this._itemIds = Object.freeze([leftItem.id, rightItem.id].sort());
    this._actualValue = actualValue;
    this._severity = Math.min(1, Math.max(0, (rule.minimumDistance - actualValue) / rule.minimumDistance));
    Object.freeze(this);
  }

  get constraint() {
    return Object.freeze({
      id: this.constraintId,
      weight: this._rule.weight,
      description: 'Недостаточный проход между предметами.'
    });
  }

  get constraintId() { return this._rule.id; }
  get featureName() { return 'minimumClearance'; }
  get operator() { return '>='; }
  get threshold() { return this._rule.minimumDistance; }
  get actualValue() { return this._actualValue; }
  get severity() { return this._severity; }
  get messageKey() { return this._rule.messageKey; }
  get itemIds() { return this._itemIds; }

  toJSON() {
    return {
      id: `${this.constraintId}:${this.itemIds.join(':')}`,
      feature: this.featureName,
      operator: this.operator,
      threshold: this.threshold,
      actualValue: this.actualValue,
      severity: this.severity,
      messageKey: this.messageKey,
      itemIds: [...this.itemIds]
    };
  }
}

export class ClearanceEvaluator {
  evaluate(roomState, rule, { excludedPairs = [] } = {}) {
    if (!roomState || typeof roomState.getItems !== 'function') {
      throw new Error('ClearanceEvaluator requires RoomState');
    }
    if (!(rule instanceof MinimumClearanceRule)) {
      throw new Error('ClearanceEvaluator requires MinimumClearanceRule');
    }

    const excludedPairKeys = new Set(excludedPairs.map(([leftItemId, rightItemId]) => (
      canonicalPairKey(leftItemId, rightItemId)
    )));
    const placedItems = roomState.getItems();
    const violations = [];
    for (let leftIndex = 0; leftIndex < placedItems.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < placedItems.length; rightIndex += 1) {
        const leftItem = placedItems[leftIndex];
        const rightItem = placedItems[rightIndex];
        if (excludedPairKeys.has(canonicalPairKey(leftItem.id, rightItem.id))) continue;
        const gap = footprintGap(leftItem, rightItem);
        if (gap < rule.minimumDistance) {
          violations.push(new ClearanceViolation(rule, leftItem, rightItem, gap));
        }
      }
    }
    return violations;
  }
}

export default ClearanceEvaluator;
