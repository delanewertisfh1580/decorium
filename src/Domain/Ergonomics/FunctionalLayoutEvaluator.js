import FunctionalLayoutRule from './FunctionalLayoutRule.js';
import { createDiagnosticId } from '../Diagnostics/DiagnosticIdentity.js';

function canonicalPair(itemIdA, itemIdB) {
  return [itemIdA, itemIdB].sort();
}

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

function vectorForLocalAxis(axis, rotationDegrees) {
  const radians = rotationDegrees * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const localAxes = {
    positiveX: { x: cos, z: -sin },
    negativeX: { x: -cos, z: sin },
    positiveZ: { x: sin, z: cos },
    negativeZ: { x: -sin, z: -cos }
  };
  return localAxes[axis];
}

function isFacingPartner(anchor, partner, maxAngleDegrees) {
  const frontAxis = anchor.item.interactionProfile.frontAxis;
  if (!frontAxis) return false;
  const front = vectorForLocalAxis(frontAxis, anchor.rotation);
  const delta = {
    x: partner.position.x - anchor.position.x,
    z: partner.position.z - anchor.position.z
  };
  const distance = Math.hypot(delta.x, delta.z);
  if (distance === 0) return false;
  const cosine = (front.x * delta.x + front.z * delta.z) / distance;
  return cosine >= Math.cos(maxAngleDegrees * Math.PI / 180);
}

function isAtUsableSide(anchor, partner) {
  const usableSides = anchor.item.interactionProfile.usableSides;
  if (usableSides.length === 0) return true;

  const delta = {
    x: partner.position.x - anchor.position.x,
    z: partner.position.z - anchor.position.z
  };
  return usableSides.some(side => {
    const axis = vectorForLocalAxis(side, anchor.rotation);
    return delta.x * axis.x + delta.z * axis.z > 0;
  });
}

function matchesSelector(placedItem, selector) {
  return placedItem.item.interactionProfile.hasAffordance(selector.affordance);
}

class FunctionalLayoutViolation {
  constructor(rule, anchor, matchedPartners) {
    this._rule = rule;
    this._itemIds = Object.freeze([anchor.id]);
    this._actualValue = matchedPartners.length;
    this._severity = Math.min(1, Math.max(0, (rule.minPartners - this._actualValue) / rule.minPartners));
    Object.freeze(this);
  }

  get constraint() {
    return Object.freeze({
      id: this.constraintId,
      weight: this._rule.weight,
      description: 'Предмету не хватает функционально связанных элементов.'
    });
  }

  get constraintId() { return this._rule.id; }
  get diagnosticId() { return createDiagnosticId(this.constraintId, this.itemIds); }
  get featureName() { return 'functionalLayout'; }
  get operator() { return '>='; }
  get threshold() { return this._rule.minPartners; }
  get actualValue() { return this._actualValue; }
  get severity() { return this._severity; }
  get messageKey() { return this._rule.messageKey; }
  get itemIds() { return this._itemIds; }

  toJSON() {
    return {
      id: this.diagnosticId,
      constraintId: this.constraintId,
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

export class FunctionalLayoutEvaluator {
  evaluate(roomState, rules) {
    if (!roomState || typeof roomState.getItems !== 'function') {
      throw new Error('FunctionalLayoutEvaluator requires RoomState');
    }
    if (!Array.isArray(rules) || !rules.every(rule => rule instanceof FunctionalLayoutRule)) {
      throw new Error('FunctionalLayoutEvaluator requires FunctionalLayoutRule array');
    }

    const placedItems = roomState.getItems();
    const violations = [];
    const matchedPairs = [];

    for (const rule of rules) {
      const anchors = placedItems
        .filter(placedItem => matchesSelector(placedItem, rule.anchorSelector))
        .sort((left, right) => left.id.localeCompare(right.id));
      const partners = placedItems
        .filter(placedItem => matchesSelector(placedItem, rule.partnerSelector))
        .sort((left, right) => left.id.localeCompare(right.id));
      const consumedPartnerIds = new Set();

      for (const anchor of anchors) {
        const matchedPartners = [];
        for (const partner of partners) {
          if (consumedPartnerIds.has(partner.id) || matchedPartners.length === rule.minPartners) continue;
          const distance = footprintGap(anchor, partner);
          const isInRange = distance >= rule.distance.min && distance <= rule.distance.max;
          const hasRequiredOrientation = rule.kind !== 'front-adjacency'
            || isFacingPartner(anchor, partner, rule.maxAngleDegrees);
          if (!isInRange || !hasRequiredOrientation || !isAtUsableSide(anchor, partner)) continue;
          consumedPartnerIds.add(partner.id);
          matchedPartners.push(partner);
          matchedPairs.push(canonicalPair(anchor.id, partner.id));
        }
        if (matchedPartners.length < rule.minPartners) {
          violations.push(new FunctionalLayoutViolation(rule, anchor, matchedPartners));
        }
      }
    }

    return Object.freeze({
      violations: Object.freeze(violations),
      matchedPairs: Object.freeze(matchedPairs.map(pair => Object.freeze(pair)))
    });
  }
}

export default FunctionalLayoutEvaluator;
