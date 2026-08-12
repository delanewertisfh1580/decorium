import { describe, expect, it } from 'vitest';
import UndoBuffer from '../../src/Presentation/Controllers/UndoBuffer.js';

describe('UI-CTRL-001 UndoBuffer', () => {
  it('undoes the latest command first and exposes its label', async () => {
    const calls = [];
    const buffer = new UndoBuffer();
    buffer.push({ label: 'Предмет перемещён', undo: async () => { calls.push('move'); } });
    buffer.push({ label: 'Предмет повернут', undo: async () => { calls.push('rotate'); } });

    expect(buffer.canUndo).toBe(true);
    expect(buffer.nextLabel).toBe('Предмет повернут');
    expect(await buffer.undo()).toEqual({ success: true, label: 'Предмет повернут' });
    expect(await buffer.undo()).toEqual({ success: true, label: 'Предмет перемещён' });
    expect(calls).toEqual(['rotate', 'move']);
    expect(buffer.canUndo).toBe(false);
  });

  it('returns a stable empty result when there is nothing to undo', async () => {
    const buffer = new UndoBuffer();

    expect(await buffer.undo()).toEqual({ success: false, label: null });
    expect(buffer.nextLabel).toBeNull();
  });

  it('limits history and ignores malformed commands', () => {
    const buffer = new UndoBuffer(2);
    buffer.push({ label: 'one', undo: () => {} });
    buffer.push({ label: 'two', undo: () => {} });
    buffer.push({ label: 'three', undo: () => {} });
    buffer.push(null);

    expect(buffer.size).toBe(2);
    expect(buffer.nextLabel).toBe('three');
  });
});
