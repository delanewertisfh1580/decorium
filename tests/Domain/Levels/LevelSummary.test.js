import { describe, expect, it } from 'vitest';
import LevelSummary from '../../../src/Domain/Levels/LevelSummary.js';

describe('LevelSummary', () => {
  it('creates an immutable authored-level summary with a stable public contract', () => {
    const summary = new LevelSummary({
      id: 'level-001',
      name: 'Гостиная: Первые шаги',
      description: 'Соберите спокойную скандинавскую гостиную.',
      sortOrder: 1
    });

    expect(summary.toJSON()).toEqual({
      id: 'level-001',
      name: 'Гостиная: Первые шаги',
      description: 'Соберите спокойную скандинавскую гостиную.',
      sortOrder: 1,
      prerequisiteLevelId: null
    });
    expect(Object.isFrozen(summary)).toBe(true);
  });

  it.each([
    [{ id: '', name: 'Name', description: 'Description', sortOrder: 1 }],
    [{ id: 'level 001', name: 'Name', description: 'Description', sortOrder: 1 }],
    [{ id: 'level-001', name: '', description: 'Description', sortOrder: 1 }],
    [{ id: 'level-001', name: 'Name', description: '', sortOrder: 1 }],
    [{ id: 'level-001', name: 'Name', description: 'Description', sortOrder: 0 }]
  ])('rejects an invalid summary %#', (input) => {
    expect(() => new LevelSummary(input)).toThrow();
  });
});
