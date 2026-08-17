import { describe, it, expect, beforeEach, vi } from 'vitest';
import EvaluateRoomUseCase from '../../../src/Application/UseCases/EvaluateRoomUseCase.js';
import EvaluationResultDTO from '../../../src/Application/DTOs/EvaluationResultDTO.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { RoomBounds } from '../../../src/Domain/Rooms/RoomBounds.js';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import { ConstraintEvaluator } from '../../../src/Domain/Constraints/ConstraintEvaluator.js';
import { LinearConstraint } from '../../../src/Domain/Constraints/LinearConstraint.js';
import { StyleScorer } from '../../../src/Domain/Scoring/StyleScorer.js';
import { StarRatingPolicy } from '../../../src/Domain/Scoring/StarRatingPolicy.js';
import ScorecardCalibrationPolicy from '../../../src/Domain/Scoring/ScorecardCalibrationPolicy.js';
import { getScoringParameters, initializeScoringParameters, resetScoringParameters } from '../../../src/Domain/Scoring/scoringParameters.js';

const createTestBounds = () => new RoomBounds(5, 5);

/**
 * Тесты для Slice A-006: EvaluateRoomUseCase
 * 
 * Проверяет:
 * - Валидацию входных данных
 * - Обработку отсутствующей комнаты
 * - Оценку пустой комнаты
 * - Успешную оценку с предметами
 * - Расчет нарушений и штрафов
 * - Определение звездного рейтинга
 * - Генерацию обратной связи
 */
describe('EvaluateRoomUseCase', () => {
  let roomRepository;
  let constraintEvaluator;
  let styleScorer;
  let starRatingPolicy;
  let evaluateRoomUseCase;

  // Тестовые параметры оценки
  const testScoringParams = {
    schemaVersion: 1,
    criticalStarCap: 2,
    scoreEpsilon: 0.000001,
    starRatingThresholds: {
      "0": 0.0,
      "1": 0.2,
      "2": 0.4,
      "3": 0.6,
      "4": 0.8,
      "5": 0.95
    },
    maxPenalty: 1.0,
    styleWeight: 1.0,
    ergonomicsWeight: 0
  };

  beforeEach(() => {
    // Инициализируем scoring parameters для тестов
    resetScoringParameters();
    initializeScoringParameters(testScoringParams);

    // Создаем мок репозитория
    roomRepository = {
      getState: async (roomId) => null,
      saveState: async (roomId, state) => {}
    };

    // Используем реальные доменные сервисы
    constraintEvaluator = new ConstraintEvaluator();
    
    const scoringParams = getScoringParameters();
    styleScorer = new StyleScorer(scoringParams);
    starRatingPolicy = new StarRatingPolicy(scoringParams.starRatingThresholds);

    evaluateRoomUseCase = new EvaluateRoomUseCase(
      roomRepository,
      constraintEvaluator,
      styleScorer,
      starRatingPolicy
    );
  });

  describe('Валидация входных данных', () => {
    it('должен вернуть ошибку при отсутствии roomId', async () => {
      const result = await evaluateRoomUseCase.execute(null, []);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('RoomID is required');
    });

    it('должен вернуть ошибку при пустом roomId', async () => {
      const result = await evaluateRoomUseCase.execute('', []);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('RoomID is required');
    });

    it('должен вернуть ошибку при невалидных ограничениях', async () => {
      roomRepository.getState = async (roomId) => RoomState.createEmpty(createTestBounds());
      
      const result = await evaluateRoomUseCase.execute('room-001', null);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Constraints must be an array');
    });

    it('должен вернуть ошибку при ограничениях не массивом', async () => {
      roomRepository.getState = async (roomId) => RoomState.createEmpty(createTestBounds());
      
      const result = await evaluateRoomUseCase.execute('room-001', 'not-an-array');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Constraints must be an array');
    });
  });

  describe('Room Not Found', () => {
    it('должен вернуть ошибку при отсутствии комнаты', async () => {
      roomRepository.getState = async (roomId) => null;
      
      const result = await evaluateRoomUseCase.execute('non-existent-room', []);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('ROOM_NOT_FOUND');
    });
  });

  describe('Оценка пустой комнаты', () => {
    it('должен вернуть минимальную оценку для пустой комнаты', async () => {
      roomRepository.getState = async (roomId) => RoomState.createEmpty(createTestBounds());
      
      const result = await evaluateRoomUseCase.execute('room-001', []);
      
      expect(result.success).toBe(true);
      expect(result.evaluationData).toBeDefined();
      expect(result.evaluationData.score).toBe(0);
      expect(result.evaluationData.stars).toBe(0);
      expect(result.evaluationData.itemCount).toBe(0);
      expect(result.evaluationData.feedback).toContain('empty');
    });
  });

  describe('Успешная оценка с предметами', () => {
    it('должен оценить комнату с одним предметом без нарушений', async () => {
      // Создаем тестовый предмет
      const featureVector = new FeatureVector({
        woodShare: 0.8,
        metalShare: 0.1,
        glassShare: 0.1,
        plasticShare: 0.1,
        textileShare: 0.2,
        lightColorShare: 0.7,
        darkColorShare: 0.3,
        warmPaletteShare: 0.8,
        saturationLevel: 0.3,
        formSimplicity: 0.6,
        roundnessShare: 0.4,
        rectilinearShare: 0.6,
        sizeNorm: 0.5,
        priceNorm: 0.5,
        lightingFunctionShare: 0.1,
        storageFunctionShare: 0.2
      });
      
      const item = new Item({
        id: 'item-001',
        name: 'Wooden Chair',
        type: 'chair',
        featureVector: featureVector
      });
      
      const roomState = RoomState.createEmpty(createTestBounds()).addItem(item);
      roomRepository.getState = async (roomId) => roomState;
      
      // Создаем ограничение, которое выполняется
      const constraint = new LinearConstraint('woodShare', 'gte', 0.5, 1.0);
      
      const result = await evaluateRoomUseCase.execute('room-001', [constraint]);
      
      expect(result.success).toBe(true);
      expect(result.evaluationData).toBeDefined();
      expect(result.evaluationData.itemCount).toBe(1);
      expect(result.evaluationData.violations).toEqual([]);
    });

    it('должен оценить комнату с нарушениями', async () => {
      // Создаем предмет с низким woodShare
      const featureVector = new FeatureVector({
        woodShare: 0.2, // Низкое значение
        metalShare: 0.8,
        glassShare: 0.5,
        plasticShare: 0.6,
        textileShare: 0.3,
        lightColorShare: 0.3,
        darkColorShare: 0.7,
        warmPaletteShare: 0.2,
        saturationLevel: 0.7,
        formSimplicity: 0.4,
        roundnessShare: 0.3,
        rectilinearShare: 0.7,
        sizeNorm: 0.5,
        priceNorm: 0.5,
        lightingFunctionShare: 0.2,
        storageFunctionShare: 0.3
      });
      
      const item = new Item({
        id: 'item-002',
        name: 'Metal Table',
        type: 'table',
        featureVector: featureVector
      });
      
      const roomState = RoomState.createEmpty(createTestBounds()).addItem(item);
      roomRepository.getState = async (roomId) => roomState;
      
      // Создаем ограничение, которое нарушается (woodShare=0.2 < threshold=0.5)
      const constraint = new LinearConstraint('woodShare', 'gte', 0.5, 'wood-min');
      
      const result = await evaluateRoomUseCase.execute('room-001', [constraint]);
      
      expect(result.success).toBe(true);
      expect(result.evaluationData).toBeDefined();
      expect(result.evaluationData.violations.length).toBeGreaterThan(0);
      expect(result.evaluationData.penalty).toBeGreaterThan(0);
      expect(result.evaluationData.score).toBeLessThan(1);
    });

    it('должен рассчитать правильный звездный рейтинг', async () => {
      // Создаем несколько предметов с хорошим соответствием стилю
      const items = [];
      for (let i = 0; i < 3; i++) {
        const featureVector = new FeatureVector({
          woodShare: 0.8,
          metalShare: 0.1,
          glassShare: 0.1,
          plasticShare: 0.1,
          textileShare: 0.2,
          lightColorShare: 0.8,
          darkColorShare: 0.2,
          warmPaletteShare: 0.7,
          saturationLevel: 0.2,
          formSimplicity: 0.8,
          roundnessShare: 0.4,
          rectilinearShare: 0.6,
          sizeNorm: 0.5,
          priceNorm: 0.5,
          lightingFunctionShare: 0.1,
          storageFunctionShare: 0.2
        });
        
        const item = new Item({
          id: `item-${i}`,
          name: `Item ${i}`,
          type: 'furniture',
          featureVector: featureVector
        });
        
        items.push(item);
      }
      
      let roomState = RoomState.createEmpty(createTestBounds());
      items.forEach(item => {
        roomState = roomState.addItem(item);
      });
      
      roomRepository.getState = async (roomId) => roomState;
      
      // Создаем выполняемые ограничения
      const constraints = [
        new LinearConstraint('woodShare', 'gte', 0.5, 1.0),
        new LinearConstraint('lightColorShare', 'gte', 0.5, 1.0)
      ];
      
      const result = await evaluateRoomUseCase.execute('room-001', constraints);
      
      expect(result.success).toBe(true);
      expect(result.evaluationData.stars).toBeGreaterThanOrEqual(4);
      expect(result.evaluationData.score).toBeGreaterThan(0.8);
    });
  });

  describe('Calibrated scorecard', () => {
    it('returns raw scoring facts and blocks completion when a critical brief rule is violated', async () => {
      const featureVector = new FeatureVector({
        woodShare: 0.8, metalShare: 0.1, glassShare: 0.1, plasticShare: 0.1, textileShare: 0.2,
        lightColorShare: 0.7, darkColorShare: 0.3, warmPaletteShare: 0.8, saturationLevel: 0.3,
        formSimplicity: 0.6, roundnessShare: 0.4, rectilinearShare: 0.6, sizeNorm: 0.5,
        priceNorm: 0.5, lightingFunctionShare: 0.1, storageFunctionShare: 0.2
      });
      const roomState = RoomState.createEmpty(createTestBounds()).addItem(new Item({
        id: 'item-calibration', name: 'Calibration item', type: 'chair', featureVector
      }));
      roomRepository.getState = async () => roomState;
      const criticalViolation = {
        constraintId: 'required-scenario:evening-media:view-target',
        featureName: 'media-viewing', operator: 'required', threshold: 1, actualValue: 0,
        severity: 'critical', messageKey: 'ergonomics.required-scenario',
        constraint: { description: 'Media seating is required.' }, critical: true, itemIds: []
      };
      const scorecardCalibrationPolicy = new ScorecardCalibrationPolicy({ schemaVersion: 1, criticalStarCap: 2 });
      const calibratedUseCase = new EvaluateRoomUseCase(
        roomRepository,
        constraintEvaluator,
        styleScorer,
        starRatingPolicy,
        { getEvaluationFeedback: async () => 'feedback' },
        { evaluate: () => [criticalViolation] },
        { evaluate: () => ({ score: 0.7, penalty: 0.3 }) },
        { aggregate: () => ({ totalScore: 0.91, styleWeight: 0.7, ergonomicsWeight: 0.3 }) },
        scorecardCalibrationPolicy
      );

      const result = await calibratedUseCase.execute(
        'room-001',
        [],
        {},
        { requiredFunctionalScenarios: [{}] },
        { minimumStars: 3, criticalRuleMode: 'block-completion' }
      );

      expect(result.success).toBe(true);
      expect(result.evaluationData).toMatchObject({
        score: 0.91,
        rawScore: 0.91,
        rawStars: 4,
        stars: 2,
        completionEligible: false,
        completionBlockReason: 'critical-rule',
        criticalViolationIds: ['required-scenario:evening-media:view-target']
      });
    });
  });

  describe('Explainable evaluation DTO', () => {
    it('returns a versioned explanation with supplied counterfactual impact and resolved violation instances', async () => {
      const featureVector = new FeatureVector({
        woodShare: 0.8, metalShare: 0.1, glassShare: 0.1, plasticShare: 0.1, textileShare: 0.2,
        lightColorShare: 0.7, darkColorShare: 0.3, warmPaletteShare: 0.8, saturationLevel: 0.3,
        formSimplicity: 0.6, roundnessShare: 0.4, rectilinearShare: 0.6, sizeNorm: 0.5,
        priceNorm: 0.5, lightingFunctionShare: 0.1, storageFunctionShare: 0.2
      });
      const roomState = RoomState.createEmpty(createTestBounds()).addItem(new Item({
        id: 'item-explained', name: 'Explained chair', type: 'chair', featureVector
      }));
      roomRepository.getState = async () => roomState;
      const violation = {
        constraintId: 'ergonomics-minimum-clearance:item-explained',
        featureName: 'minimum-clearance', operator: 'gte', threshold: 0.8, actualValue: 0.3,
        severity: 0.7, messageKey: 'ergonomics-minimum-clearance',
        constraint: { description: 'Keep the route clear.' }, critical: false, itemIds: ['item-explained']
      };
      const violationImpactPolicy = {
        evaluate: vi.fn(() => ({
          current: { styleScore: 1, ergonomicsScore: 0.5, totalScore: 0.85, stars: 4, completionEligible: true },
          impacts: [{
            violationId: 'ergonomics-minimum-clearance:item-explained',
            channel: 'ergonomics', channelScoreDelta: 0.5, totalScoreDelta: 0.15,
            displayStarsDelta: 1, completionEffect: 'none'
          }]
        }))
      };
      const explainableUseCase = new EvaluateRoomUseCase(
        roomRepository,
        constraintEvaluator,
        styleScorer,
        starRatingPolicy,
        {
          getEvaluationFeedback: async () => ['feedback'],
          getViolationExplanation: async () => ({
            messageKey: 'ergonomics-minimum-clearance',
            severity: 'high',
            remediation: 'Оставьте больше прохода между предметами.'
          })
        },
        { evaluate: () => [violation] },
        { evaluate: () => ({ score: 0.5, penalty: 0.7 }) },
        { aggregate: () => ({ totalScore: 0.85, styleWeight: 0.7, ergonomicsWeight: 0.3 }) },
        new ScorecardCalibrationPolicy({ schemaVersion: 1, criticalStarCap: 2 }),
        violationImpactPolicy
      );

      const result = await explainableUseCase.execute(
        'room-001',
        [],
        {},
        { minimumClearance: {} },
        { minimumStars: 3, criticalRuleMode: 'block-completion' }
      );

      expect(violationImpactPolicy.evaluate).toHaveBeenCalledWith({
        styleViolations: [],
        ergonomicsViolations: [violation],
        ratingPolicy: starRatingPolicy,
        completion: { minimumStars: 3, criticalRuleMode: 'block-completion' }
      });
      expect(result.evaluationData.explanation).toEqual({
        schemaVersion: 1,
        scorecard: {
          rawScore: 0.85,
          rawStars: 4,
          displayStars: 4,
          completionEligible: true,
          completionBlockReason: null
        },
        violations: [{
          id: 'ergonomics-minimum-clearance:item-explained',
          channel: 'ergonomics',
          scope: 'instances',
          rule: { messageKey: 'ergonomics-minimum-clearance', description: 'Keep the route clear.' },
          fact: { operator: 'gte', actual: 0.3, desired: 0.8 },
          severity: { level: 'high', value: 0.7, critical: false },
          impact: {
            channelScoreDelta: 0.5,
            totalScoreDelta: 0.15,
            displayStarsDelta: 1,
            completionEffect: 'none'
          },
          remediation: 'Оставьте больше прохода между предметами.',
          instances: [{ instanceId: 'item-explained', itemId: 'item-explained', displayName: 'Explained chair' }]
        }]
      });
    });
  });

  describe('Структура DTO', () => {
    it('должен вернуть полную структуру evaluationData при успехе', async () => {
      const featureVector = new FeatureVector({
        woodShare: 0.8,
        metalShare: 0.1,
        glassShare: 0.1,
        plasticShare: 0.1,
        textileShare: 0.2,
        lightColorShare: 0.7,
        darkColorShare: 0.3,
        warmPaletteShare: 0.8,
        saturationLevel: 0.3,
        formSimplicity: 0.6,
        roundnessShare: 0.4,
        rectilinearShare: 0.6,
        sizeNorm: 0.5,
        priceNorm: 0.5,
        lightingFunctionShare: 0.1,
        storageFunctionShare: 0.2
      });
      
      const item = new Item({
        id: 'item-001',
        name: 'Test Item',
        type: 'decor',
        featureVector: featureVector
      });
      
      const roomState = RoomState.createEmpty(createTestBounds()).addItem(item);
      roomRepository.getState = async (roomId) => roomState;
      
      const constraints = [new LinearConstraint('woodShare', 'gte', 0.5, 1.0)];
      
      const result = await evaluateRoomUseCase.execute('room-001', constraints);
      
      expect(result.evaluationData).toHaveProperty('score');
      expect(result.evaluationData).toHaveProperty('penalty');
      expect(result.evaluationData).toHaveProperty('stars');
      expect(result.evaluationData).toHaveProperty('violations');
      expect(result.evaluationData).toHaveProperty('itemCount');
      expect(result.evaluationData).toHaveProperty('feedback');
      expect(Array.isArray(result.evaluationData.violations)).toBe(true);
    });
  });

  describe('Обработка ошибок репозитория', () => {
    it('должен обработать ошибку репозитория', async () => {
      roomRepository.getState = async (roomId) => {
        throw new Error('Database connection failed');
      };
      
      const result = await evaluateRoomUseCase.execute('room-001', []);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('UNEXPECTED_ERROR');
    });
  });

  describe('Генерация обратной связи', () => {
    it('должен генерировать разные сообщения для разных уровней звезд', async () => {
      const testCases = [
        { stars: 5, expectedPhrase: 'Excellent' },
        { stars: 4, expectedPhrase: 'Great' },
        { stars: 3, expectedPhrase: 'Not bad' },
        { stars: 2, expectedPhrase: 'significant changes' },
        { stars: 1, expectedPhrase: 'Poor' },
        { stars: 0, expectedPhrase: 'Very poor' }
      ];

      // Проверяем, что метод _generateFeedback существует
      expect(evaluateRoomUseCase._generateFeedback).toBeDefined();
      
      testCases.forEach(({ stars, expectedPhrase }) => {
        const feedback = evaluateRoomUseCase._generateFeedback(stars, []);
        expect(feedback).toContain(expectedPhrase);
      });
    });
  });
});


describe('PROD-023 multi-style and client-priority evaluation', () => {
  it('uses the V2 evaluationSpec to compose multi-style, client-priority and ergonomics channels without UI scoring', async () => {
    const roomRepository = { getState: async () => null };
    const constraintEvaluator = new ConstraintEvaluator();
    const styleScorer = new StyleScorer({ maxPenalty: 1, defaultWeight: 1 });
    const starRatingPolicy = new StarRatingPolicy({ '0': 0, '1': 0, '2': 0.4, '3': 0.56, '4': 0.71, '5': 0.86 });
    const roomState = RoomState.createEmpty(createTestBounds()).addItem(new Item({
      id: 'item-v2',
      name: 'V2 chair',
      type: 'chair',
      featureVector: new FeatureVector({
        woodShare: 0.8, metalShare: 0.2, glassShare: 0.1, plasticShare: 0.1, textileShare: 0.2,
        lightColorShare: 0.7, darkColorShare: 0.3, warmPaletteShare: 0.7, saturationLevel: 0.3,
        formSimplicity: 0.8, roundnessShare: 0.3, rectilinearShare: 0.7, sizeNorm: 0.5,
        priceNorm: 0.5, lightingFunctionShare: 0.2, storageFunctionShare: 0.2
      })
    }));
    roomRepository.getState = async () => roomState;
    const priorityViolation = {
      constraintId: 'client-priority:warm-intimacy', featureName: 'spatialPreferencePriority', operator: 'gte',
      threshold: 1, actualValue: 0.5, severity: 0.5, messageKey: 'priority-warm-intimacy',
      constraint: { description: 'Камерная атмосфера' }, critical: false, itemIds: []
    };
    const multiStyleResult = {
      weightedTargetFit: 0.8,
      targets: [{ styleId: 'scandinavian', role: 'primary', weight: 0.7, score: 0.9, penalty: 0.1, violations: [] }]
    };
    const clientPriorityResult = {
      score: 0.5,
      results: [{ id: 'warm-intimacy', label: 'Камерная атмосфера', weight: 1, ruleKind: 'spatial-preferences', satisfaction: 0.5, satisfied: false }],
      violations: [priorityViolation]
    };
    const multiStyleDependencies = {
      multiStyleEvaluator: {
        evaluate: vi.fn(() => multiStyleResult)
      },
      styleChannelPolicy: { evaluate: vi.fn(() => ({ score: 0.7, targetFitWeight: 0.75, compositionWeight: 0.25 })) },
      roomOccupancyProfile: { evaluate: vi.fn(() => ({ schemaVersion: 1, freeAreaRatio: 0.7 })) },
      clientPriorityEvaluator: {
        evaluate: vi.fn(() => clientPriorityResult)
      },
      threeChannelScoreAggregator: {
        aggregate: vi.fn(() => ({ totalScore: 0.73, styleWeight: 0.5, clientPriorityWeight: 0.2, ergonomicsWeight: 0.3 }))
      }
    };
    const useCase = new EvaluateRoomUseCase(
      roomRepository,
      constraintEvaluator,
      styleScorer,
      starRatingPolicy,
      { getEvaluationFeedback: async () => ['feedback'] },
      { evaluate: () => [] },
      { evaluate: () => ({ score: 0.9, penalty: 0.1 }) },
      { aggregate: () => ({ totalScore: 0.9, styleWeight: 0.7, ergonomicsWeight: 0.3 }) },
      null,
      null,
      multiStyleDependencies
    );
    const evaluationSpec = {
      schemaVersion: 1,
      styleTargets: [{ styleId: 'scandinavian', role: 'primary', weight: 1, constraints: [] }],
      clientPriorities: [{ id: 'warm-intimacy', rule: { kind: 'spatial-preferences' } }],
      spatialPreferences: { density: 'intimate', emptySpacePreference: { mode: 'discourage-excess', targetFreeAreaRatio: 0.42 } },
      compositionRules: {},
      ergonomicsRules: { minimumClearance: {} },
      completion: { minimumStars: 3, criticalRuleMode: 'informational' }
    };

    const result = await useCase.execute('room-001', [], {}, {}, null, evaluationSpec);

    expect(result.success).toBe(true);
    expect(result.evaluationData).toMatchObject({
      score: 0.73,
      styleScore: 0.7,
      clientPriorityScore: 0.5,
      ergonomicsScore: 0.9,
      scoreWeights: { style: 0.5, clientPriorities: 0.2, ergonomics: 0.3 },
      scoreBreakdown: {
        schemaVersion: 1,
        style: expect.objectContaining({ score: 0.7, targets: multiStyleResult.targets }),
        clientPriorities: expect.objectContaining({ score: 0.5, results: clientPriorityResult.results }),
        ergonomics: { score: 0.9, weight: 0.3 }
      }
    });
    expect(result.evaluationData.violations).toContainEqual(expect.objectContaining({ id: 'client-priority:warm-intimacy', type: 'client-priority' }));
  });
});
