import { RoomState } from './RoomState.js';
import { FeatureVector } from '../Items/FeatureVector.js';

/**
 * Domain service for calculating the aggregate 16-field vector of a room.
 */
export class RoomVectorCalculator {
  static calculate(roomState) {
    if (!(roomState instanceof RoomState)) {
      throw new Error('RoomVectorCalculator requires a RoomState instance');
    }

    const items = roomState.getItems();
    if (items.length === 0) return RoomVectorCalculator.zeroVector();
    return FeatureVector.average(items.map(item => item.featureVector));
  }

  static zeroVector() {
    return new FeatureVector(Object.fromEntries(
      FeatureVector.REQUIRED_FIELDS.map(field => [field, 0])
    ));
  }
}

export default RoomVectorCalculator;
