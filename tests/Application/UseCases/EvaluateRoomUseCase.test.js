import { describe, expect, it, vi } from 'vitest';
import EvaluateRoomUseCase from '../../../src/Application/UseCases/EvaluateRoomUseCase.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { StyleScorer } from '../../../src/Domain/Scoring/StyleScorer.js';
import { StarRatingPolicy } from '../../../src/Domain/Scoring/StarRatingPolicy.js';
import ScorecardCalibrationPolicy from '../../../src/Domain/Scoring/ScorecardCalibrationPolicy.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import StyleInfluenceProfile from '../../../src/Domain/Scoring/StyleInfluenceProfile.js';

const styleInfluencePolicy = Object.freeze({
  schemaVersion: 1,
  mode: 'capped-square-root-footprint',
  referenceAreaM2: 1,
  minimumWeight: 0.5,
  maximumWeight: 2
});

function featureVector(woodShare) {
  return new FeatureVector({
    woodShare,
    metalShare: 0,
    glassShare: 0,
    plasticShare: 0,
    textileShare: 0,
    lightColorShare: 0,
    darkColorShare: 0,
    warmPaletteShare: 0,
    saturationLevel: 0,
    formSimplicity: 0,
    roundnessShare: 0,
    rectilinearShare: 0,
    sizeNorm: 0,
    priceNorm: 0,
    lightingFunctionShare: 0,
    storageFunctionShare: 0
  });
}

const evaluationSpec = Object.freeze({
  schemaVersion: 1,
  styleTargets: Object.freeze([{ styleId: 'scandinavian', role: 'primary', weight: 1, constraints: Object.freeze([]) }]),
  clientPriorities: Object.freeze([]),
  spatialPreferences: Object.freeze({ density: 'balanced', emptySpacePreference: Object.freeze({ mode: 'allow', targetFreeAreaRatio: 0.5 }) }),
  compositionRules: Object.freeze({}),
  ergonomicsRules: Object.freeze({ requiredFunctionalScenarios: Object.freeze([]) }),
  completion: Object.freeze({ minimumStars: 3, criticalRuleMode: 'informational' })
});

function createUseCase(roomState = null) {
  const roomRepository = { getState: vi.fn(async () => roomState) };
  const styleScorer = new StyleScorer({ maxPenalty: 1, defaultWeight: 1 });
  const starRatingPolicy = new StarRatingPolicy({ '0': 0, '1': 0, '2': 0.4, '3': 0.56, '4': 0.71, '5': 0.86 });
  const feedbackCatalog = {
    getEvaluationFeedback: vi.fn(async () => ['feedback']),
    getViolationExplanation: vi.fn(async () => ({ severity: 'low', remediation: 'Исправьте правило.' }))
  };
  const multiStyleDependencies = {
    multiStyleEvaluator: { evaluate: vi.fn(() => ({ weightedTargetFit: 0.9, targets: [] })) },
    styleChannelPolicy: { evaluate: vi.fn(() => ({ score: 0.8 })) },
    styleInfluenceProfile: {
      policy: styleInfluencePolicy,
      evaluate: vi.fn(({ placedItems }) => StyleInfluenceProfile.fromPlacedItems({
        placedItems,
        styleInfluence: styleInfluencePolicy
      }))
    },
    roomOccupancyProfile: { evaluate: vi.fn(() => ({ schemaVersion: 1, freeAreaRatio: 1 })) },
    clientPriorityEvaluator: { evaluate: vi.fn(() => ({ score: 0.7, results: [], violations: [] })) },
    threeChannelScoreAggregator: { aggregate: vi.fn(() => ({ totalScore: 0.81, styleWeight: 0.5, clientPriorityWeight: 0.2, ergonomicsWeight: 0.3 })) },
    multiChannelViolationImpactPolicy: { evaluate: vi.fn(() => ({ impacts: [] })) }
  };
  return {
    roomRepository,
    multiStyleDependencies,
    useCase: new EvaluateRoomUseCase(
      roomRepository,
      styleScorer,
      starRatingPolicy,
      feedbackCatalog,
      { evaluate: vi.fn(() => []) },
      { evaluate: vi.fn(() => ({ score: 0.9, penalty: 0.1 })) },
      new ScorecardCalibrationPolicy({ schemaVersion: 1, criticalStarCap: 2 }),
      multiStyleDependencies
    )
  };
}

describe('EvaluateRoomUseCase V2', () => {
  it('rejects incomplete V2 evaluation input before accessing room state', async () => {
    const { useCase, roomRepository } = createUseCase();

    await expect(useCase.execute()).resolves.toMatchObject({ success: false, error: 'INVALID_INPUT: RoomID is required.' });
    await expect(useCase.execute({ roomId: 'room-001' })).resolves.toMatchObject({ success: false, error: 'INVALID_INPUT: EvaluationSpec v1 is required.' });
    expect(roomRepository.getState).not.toHaveBeenCalled();
  });

  it('returns a typed failure when the V2 request targets a missing room', async () => {
    const { useCase } = createUseCase();

    await expect(useCase.execute({ roomId: 'room-001', evaluationSpec })).resolves.toMatchObject({
      success: false,
      error: 'ROOM_NOT_FOUND: Room room-001 not found.'
    });
  });

  it('converts an asynchronous explanation failure into a typed evaluation result', async () => {
    const roomState = RoomState.createEmpty(new RoomBounds(5, 5));
    const { useCase } = createUseCase(roomState);
    useCase._evaluateV2 = vi.fn().mockRejectedValue(new Error('missing authored feedback'));

    await expect(useCase.execute({ roomId: 'room-001', evaluationSpec })).resolves.toMatchObject({
      success: false,
      error: 'UNEXPECTED_ERROR: missing authored feedback'
    });
  });

  it('evaluates a room through the three active channels and returns V2 explanation data', async () => {
    const roomState = RoomState.createEmpty(new RoomBounds(5, 5));
    const { useCase, multiStyleDependencies } = createUseCase(roomState);

    const result = await useCase.execute({ roomId: 'room-001', evaluationSpec });

    expect(result.success).toBe(true);
    expect(result.evaluationData).toMatchObject({
      score: 0.81,
      styleScore: 0.8,
      clientPriorityScore: 0.7,
      ergonomicsScore: 0.9,
      styleTargetPenalty: 1,
      compositionPenalty: 0,
      styleChannelPenalty: 0.2,
      scoreWeights: { style: 0.5, clientPriorities: 0.2, ergonomics: 0.3 },
      explanation: { schemaVersion: 2, violations: [] },
      scoreBreakdown: {
        schemaVersion: 1,
        style: expect.objectContaining({
          score: 0.8,
          targetPenalty: 1,
          compositionPenalty: 0,
          channelPenalty: 0.2
        }),
        clientPriorities: expect.objectContaining({ score: 0.7 }),
        ergonomics: { score: 0.9, weight: 0.3 }
      }
    });
    expect(result.evaluationData.styleInfluence).toEqual({
      policy: styleInfluencePolicy,
      totalWeight: 0,
      contributions: []
    });
    expect(multiStyleDependencies.multiStyleEvaluator.evaluate).not.toHaveBeenCalled();
    expect(multiStyleDependencies.threeChannelScoreAggregator.aggregate).toHaveBeenCalledWith({
      styleScore: 0.8,
      clientPriorityScore: 0.7,
      ergonomicsScore: 0.9
    });
  });

  it('builds the style vector from every placed visual instance and exposes capped footprint contribution facts', async () => {
    const placedItems = [
      Object.freeze({ id: 'wall-art#1', itemId: 'wall-art', dimensions: { x: 0.02, z: 1 }, featureVector: featureVector(0), interactionProfile: { affordances: [] } }),
      Object.freeze({ id: 'sofa#1', itemId: 'sofa', dimensions: { x: 4.5, z: 1 }, featureVector: featureVector(1), interactionProfile: { affordances: [] } })
    ];
    const roomState = Object.freeze({ getItems: () => placedItems, getItem: () => null });
    const { useCase, multiStyleDependencies } = createUseCase(roomState);

    const result = await useCase.execute({ roomId: 'room-001', evaluationSpec });

    expect(result.success).toBe(true);
    expect(multiStyleDependencies.styleInfluenceProfile.evaluate).toHaveBeenCalledWith({ placedItems });
    expect(multiStyleDependencies.multiStyleEvaluator.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      roomVector: expect.any(FeatureVector)
    }));
    expect(result.evaluationData.roomVector.woodShare).toBeCloseTo(0.8, 12);
    expect(result.evaluationData.styleInfluence).toEqual(expect.objectContaining({
      policy: styleInfluencePolicy,
      totalWeight: 2.5,
      contributions: expect.arrayContaining([
        expect.objectContaining({ instanceId: 'wall-art#1', influenceWeight: 0.5, influenceShare: 0.2 }),
        expect.objectContaining({ instanceId: 'sofa#1', influenceWeight: 2, influenceShare: 0.8 })
      ])
    }));
    expect(result.evaluationData.scoreBreakdown.style.influence).toBe(result.evaluationData.styleInfluence);
  });
});
