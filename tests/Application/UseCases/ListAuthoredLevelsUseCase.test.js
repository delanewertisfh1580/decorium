import { describe, expect, it } from 'vitest';
import LevelSummary from '../../../src/Domain/Levels/LevelSummary.js';
import ListAuthoredLevelsUseCase from '../../../src/Application/UseCases/ListAuthoredLevelsUseCase.js';

class MockLevelRepository {
  constructor(levels) {
    this.levels = levels;
  }

  async listLevels() {
    return this.levels;
  }
}

describe('ListAuthoredLevelsUseCase', () => {
  it('returns immutable domain summaries sorted by author-defined order', async () => {
    const repository = new MockLevelRepository([
      { id: 'level-002', name: 'Тёплый уголок', description: 'Соберите уютную зону отдыха.', sortOrder: 2 },
      { id: 'level-001', name: 'Первые шаги', description: 'Освойте основу композиции.', sortOrder: 1 }
    ]);
    const useCase = new ListAuthoredLevelsUseCase(repository);

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toBeInstanceOf(LevelSummary);
    expect(result.data.map(level => level.id)).toEqual(['level-001', 'level-002']);
  });

  it('rejects duplicate IDs before they reach presentation', async () => {
    const repository = new MockLevelRepository([
      { id: 'level-001', name: 'Первый', description: 'Описание.', sortOrder: 1 },
      { id: 'level-001', name: 'Повтор', description: 'Описание.', sortOrder: 2 }
    ]);
    const useCase = new ListAuthoredLevelsUseCase(repository);

    const result = await useCase.execute();

    expect(result.success).toBe(false);
    expect(result.error).toContain('DUPLICATE_LEVEL_ID');
  });

  it('returns a content error when the authored catalog is invalid', async () => {
    const useCase = new ListAuthoredLevelsUseCase(new MockLevelRepository([
      { id: 'bad id', name: 'Некорректный', description: 'Описание.', sortOrder: 1 }
    ]));

    const result = await useCase.execute();

    expect(result.success).toBe(false);
    expect(result.error).toContain('INVALID_LEVEL_CATALOG');
  });

  it('requires a level repository with a listing method', () => {
    expect(() => new ListAuthoredLevelsUseCase()).toThrow('levelRepository');
    expect(() => new ListAuthoredLevelsUseCase({ loadLevel: async () => null })).toThrow('listLevels');
  });
});
