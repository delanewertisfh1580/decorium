import { RoomState } from './RoomState.js';

/**
 * Domain Service for calculating the room's aggregate feature vector.
 */
export class RoomVectorCalculator {
  /**
   * Calculates the average feature vector of all items in the room.
   * @param {RoomState} roomState - The current state of the room
   * @returns {FeatureVector} - The averaged feature vector
   */
  static calculate(roomState) {
    if (!(roomState instanceof RoomState)) {
      throw new Error('RoomVectorCalculator requires a RoomState instance');
    }

    const items = roomState.getItems();
    
    if (items.length === 0) {
      return this._createZeroVector();
    }

    return this._averageVectors(items.map(item => item.featureVector));
  }

  /**
   * Creates a zero vector for all dimensions.
   * @private
   * @returns {FeatureVector}
   */
  static _createZeroVector() {
    const FeatureVector = require('../Items/FeatureVector.js').FeatureVector;
    return new FeatureVector({
      woodShare: 0,
      metalShare: 0,
      glassShare: 0,
      lightColorShare: 0,
      warmPaletteShare: 0,
      formSimplicity: 0,
      saturationLevel: 0,
      plasticShare: 0
    });
  }

  /**
   * Averages multiple feature vectors.
   * @private
   * @param {FeatureVector[]} vectors - Array of vectors to average
   * @returns {FeatureVector}
   */
  static _averageVectors(vectors) {
    const FeatureVector = require('../Items/FeatureVector.js').FeatureVector;
    
    const sum = vectors.reduce((acc, vector) => {
      return {
        woodShare: acc.woodShare + vector.woodShare,
        metalShare: acc.metalShare + vector.metalShare,
        glassShare: acc.glassShare + vector.glassShare,
        lightColorShare: acc.lightColorShare + vector.lightColorShare,
        warmPaletteShare: acc.warmPaletteShare + vector.warmPaletteShare,
        formSimplicity: acc.formSimplicity + vector.formSimplicity,
        saturationLevel: acc.saturationLevel + vector.saturationLevel,
        plasticShare: acc.plasticShare + vector.plasticShare
      };
    }, {
      woodShare: 0,
      metalShare: 0,
      glassShare: 0,
      lightColorShare: 0,
      warmPaletteShare: 0,
      formSimplicity: 0,
      saturationLevel: 0,
      plasticShare: 0
    });

    const count = vectors.length;
    return new FeatureVector({
      woodShare: sum.woodShare / count,
      metalShare: sum.metalShare / count,
      glassShare: sum.glassShare / count,
      lightColorShare: sum.lightColorShare / count,
      warmPaletteShare: sum.warmPaletteShare / count,
      formSimplicity: sum.formSimplicity / count,
      saturationLevel: sum.saturationLevel / count,
      plasticShare: sum.plasticShare / count
    });
  }
}
