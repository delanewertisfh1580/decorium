# ADR-005: Deterministic Test Data

## Status
Accepted

## Date
2024-01-01

## Owner
Qwen Studio Engineering Team

## Title
Использовать детерминированные тестовые данные и seed для воспроизводимости тестов

## Context
Тесты должны быть:
- Воспроизводимыми (одинаковые результаты при каждом запуске)
- Независимыми от времени и внешнего состояния
- Детерминированными (нет случайности без seed)

Проблемы недетерминированных тестов:
- Тесты иногда проходят, иногда нет (flaky tests)
- Невозможно доверять результатам CI/CD
- Сложно отлаживать failures
- Разные результаты на разных машинах

## Decision
Все тесты должны использовать детерминированные данные.

### Правила

1. **Никакой настоящей случайности**
   - Не использовать `Math.random()` в тестах
   - Не использовать `Date.now()` без мока
   - Не зависеть от глобального состояния

2. **Использовать фиксированные данные**
   ```typescript
   // Правильно
   const item = new Item('test-item-1', 'Test Chair', new FeatureVector(0.8, 0.1, 0.0, 0.6, 0.7, 0.5));
   
   // Неправильно
   const item = generateRandomItem();
   ```

3. **Использовать deterministic RNG с seed если нужна случайность**
   ```typescript
   // Правильно
   const rng = new DeterministicRng(seed: 12345);
   const value = rng.next(); // всегда одинаковое для seed 12345
   
   // Неправильно
   const value = Math.random();
   ```

4. **Изолировать тесты друг от друга**
   - Каждый тест создаёт своё состояние
   - Нет общего mutable состояния между тестами
   - Использовать fresh instances

5. **Mock время если нужно**
   ```typescript
   // Правильно
   const mockClock = new MockClock(fixedTime: Date);
   
   // Неправильно
   const now = new Date(); // зависит от времени запуска
   ```

### Пример теста

```typescript
describe('StyleScorer', () => {
  it('calculates score correctly for given penalties', () => {
    // Arrange - фиксированные данные
    const penalties = [0.2, 0.1, 0.0];
    const scorer = new StyleScorer();
    
    // Act
    const score = scorer.calculateScore(penalties);
    
    // Assert - детерминированный результат
    expect(score).toBe(0.9); // всегда 0.9 для этих данных
  });
});
```

### Golden Tests

Для сценариев оценки использовать golden tests:

```typescript
describe('MVP Golden Scenario', () => {
  const levelId = 'level-001';
  const placedItems = [
    new PlacedItem('item-001', {x:0, y:0, z:0}, {x:0, y:0, z:0, w:1}),
    new PlacedItem('item-002', {x:1, y:0, z:0}, {x:0, y:0, z:0, w:1}),
    new PlacedItem('item-003', {x:2, y:0, z:0}, {x:0, y:0, z:0, w:1}),
  ];
  
  const expectedScore = 0.85;
  const expectedRating = 4;
  const expectedViolations = ['wood_share'];
  
  it('produces expected evaluation result', () => {
    // Arrange
    const evaluator = createEvaluator(levelId, placedItems);
    
    // Act
    const result = evaluator.evaluate();
    
    // Assert
    expect(result.score).toBeCloseTo(expectedScore);
    expect(result.starRating).toBe(expectedRating);
    expect(result.violations).toEqual(expectedViolations);
  });
});
```

## Consequences

### Positive
- Тесты всегда воспроизводимы
- Легко отлаживать failures
- Доверие к CI/CD pipeline
- Тесты работают одинаково на всех машинах

### Negative
- Требуется дисциплина при написании тестов
- Иногда сложнее настроить фиксированные данные

### Neutral
- Необходимость в DeterministicRng классе
- Требует review тестов на детерминизм

## Implementation

### DeterministicRng Class

```typescript
// Infrastructure/Random/DeterministicRng.ts
export class DeterministicRng {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}
```

## Related Documents
- [[Test Policy]](../test-policy.md)
- [[MVP Acceptance Criteria]](../history/mvp/acceptance-criteria.md)
- [[Definition of Done]](../history/mvp/definition-of-done.md)

## Change History
| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-01-01 | 1.0 | Qwen Studio | Initial ADR |
