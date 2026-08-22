import PassageZone from './PassageZone.js';
import { createDiagnosticId } from '../Diagnostics/DiagnosticIdentity.js';

function dimensionsFor(placedItem) {
  const dimensions = placedItem.dimensions ?? { x: 1, z: 1 };
  return placedItem.rotation % 180 === 0 ? dimensions : { x: dimensions.z, z: dimensions.x };
}

function participatesInPassage(placedItem) {
  const behavior = placedItem?.item?.spatialBehavior ?? placedItem?.spatialBehavior;
  return behavior?.isFloorObstacle === true;
}

function itemRectangle(placedItem) {
  const dimensions = dimensionsFor(placedItem);
  return {
    minX: placedItem.position.x - dimensions.x / 2,
    maxX: placedItem.position.x + dimensions.x / 2,
    minZ: placedItem.position.z - dimensions.z / 2,
    maxZ: placedItem.position.z + dimensions.z / 2
  };
}

function zoneRectangle(zone) {
  return {
    minX: zone.x,
    maxX: zone.x + zone.width,
    minZ: zone.z,
    maxZ: zone.z + zone.depth
  };
}

function overlapArea(left, right) {
  const overlapX = Math.max(0, Math.min(left.maxX, right.maxX) - Math.max(left.minX, right.minX));
  const overlapZ = Math.max(0, Math.min(left.maxZ, right.maxZ) - Math.max(left.minZ, right.minZ));
  return overlapX * overlapZ;
}

class PassageZoneViolation {
  constructor(zone, item, area) {
    this._zone = zone;
    this._item = item;
    this._area = area;
    this._severity = Math.min(1, area / (zone.width * zone.depth));
    Object.freeze(this);
  }

  get constraint() {
    return Object.freeze({
      id: this.constraintId,
      weight: this._zone.weight,
      description: `Перекрыт проход: ${this._zone.label}.`
    });
  }

  get constraintId() { return 'ergonomics-passage-zone-free'; }
  get diagnosticId() { return createDiagnosticId(this.constraintId, [this.zoneId, ...this.itemIds]); }
  get featureName() { return 'passageZone'; }
  get operator() { return 'disjoint'; }
  get threshold() { return 0; }
  get actualValue() { return this._area; }
  get severity() { return this._severity; }
  get messageKey() { return this._zone.messageKey; }
  get itemIds() { return Object.freeze([this._item.id]); }
  get zoneId() { return this._zone.id; }
  get zoneLabel() { return this._zone.label; }
}

export class PassageZoneEvaluator {
  evaluate(roomState, zones) {
    if (!roomState || typeof roomState.getItems !== 'function') {
      throw new Error('PassageZoneEvaluator requires RoomState');
    }
    if (!Array.isArray(zones) || !zones.every(zone => zone instanceof PassageZone)) {
      throw new Error('PassageZoneEvaluator requires an array of PassageZone');
    }

    const violations = [];
    for (const zone of zones) {
      const zoneRect = zoneRectangle(zone);
      for (const item of roomState.getItems().filter(participatesInPassage)) {
        const area = overlapArea(itemRectangle(item), zoneRect);
        if (area > 0) violations.push(new PassageZoneViolation(zone, item, area));
      }
    }
    return violations;
  }
}

export default PassageZoneEvaluator;
