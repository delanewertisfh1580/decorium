import { describe, it, expect, beforeEach } from 'vitest';
import EvaluateRoomUseCase from '../../../src/Application/UseCases/EvaluateRoomUseCase.js';
import EvaluationResultDTO from '../../../src/Application/DTOs/EvaluationResultDTO.js';
import { RoomState } from '../../../src/Domain/Rooms/RoomState.js';
import { Item } from '../../../src/Domain/Items/Item.js';
import { FeatureVector } from '../../../src/Domain/Items/FeatureVector.js';
import { ConstraintEvaluator } from '../../../src/Domain/Constraints/ConstraintEvaluator.js';
import { LinearConstraint } from '../../../src/Domain/Constraints/LinearConstraint.js';
import { StyleScorer } from '../../../src/Domain/Scoring/StyleScorer.js';
import { StarRatingPolicy } from '../../../src/Domain/Scoring/StarRatingPolicy.js';
import { getScoringParameters, initializeScoringParameters, resetScoringParameters } from '../../../src/Domain/Scoring/scoringParameters.js';

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
      roomRepository.getState = async (roomId) => RoomState.createEmpty();
      
      const result = await evaluateRoomUseCase.execute('room-001', null);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Constraints must be an array');
    });

    it('должен вернуть ошибку при ограничениях не массивом', async () => {
      roomRepository.getState = async (roomId) => RoomState.createEmpty();
      
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
      roomRepository.getState = async (roomId) => RoomState.createEmpty();
      
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
        lightColorShare: 0.7,
        warmPaletteShare: 0.8,
        formSimplicity: 0.6,
        saturationLevel: 0.3,
        plasticShare: 0.1
      });
      
      const item = new Item({
        id: 'item-001',
        name: 'Wooden Chair',
        type: 'chair',
        featureVector: featureVector
      });
      
      const roomState = RoomState.createEmpty().addItem(item);
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
        lightColorShare: 0.3,
        warmPaletteShare: 0.2,
        formSimplicity: 0.4,
        saturationLevel: 0.7,
        plasticShare: 0.6
      });
      
      const item = new Item({
        id: 'item-002',
        name: 'Metal Table',
        type: 'table',
        featureVector: featureVector
      });
      
      const roomState = RoomState.createEmpty().addItem(item);
      roomRepository.getState = async (roomId) => roomState;
      
      // Создаем ограничение, которое нарушается
      const constraint = new LinearConstraint('woodShare', 'gte', 0.5);
      
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
          lightColorShare: 0.8,
          warmPaletteShare: 0.7,
          formSimplicity: 0.8,
          saturationLevel: 0.2,
          plasticShare: 0.1
        });
        
        const item = new Item({
          id: `item-${i}`,
          name: `Item ${i}`,
          type: 'furniture',
          featureVector: featureVector
        });
        
        items.push(item);
      }
      
      let roomState = RoomState.createEmpty();
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

  describe('Структура DTO', () => {
    it('должен вернуть полную структуру evaluationData при успехе', async () => {
      const featureVector = new FeatureVector({
        woodShare: 0.8,
        metalShare: 0.1,
        glassShare: 0.1,
        lightColorShare: 0.7,
        warmPaletteShare: 0.8,
        formSimplicity: 0.6,
        saturationLevel: 0.3,
        plasticShare: 0.1
      });
      
      const item = new Item({
        id: 'item-001',
        name: 'Test Item',
        type: 'decor',
        featureVector: featureVector
      });
      
      const roomState = RoomState.createEmpty().addItem(item);
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
