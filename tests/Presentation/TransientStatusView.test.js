// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TransientStatusView } from '../../src/Presentation/Views/TransientStatusView.js';

afterEach(() => vi.useRealTimers());

describe('TransientStatusView', () => {
  it('shows a message and hides it after the configured duration', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    container.classList.add('hidden');
    const view = new TransientStatusView(container, { defaultDurationMs: 100 });

    view.show('Готово');

    expect(container.textContent).toBe('Готово');
    expect(container.classList.contains('hidden')).toBe(false);
    vi.advanceTimersByTime(100);
    expect(container.classList.contains('hidden')).toBe(true);
  });

  it('resets the previous hide timer when a newer status supersedes it', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const view = new TransientStatusView(container, { defaultDurationMs: 100 });

    view.show('Первое');
    vi.advanceTimersByTime(60);
    view.show('Второе');
    vi.advanceTimersByTime(60);

    expect(container.textContent).toBe('Второе');
    expect(container.classList.contains('hidden')).toBe(false);
    vi.advanceTimersByTime(40);
    expect(container.classList.contains('hidden')).toBe(true);
  });

  it('clears pending timers during teardown', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const view = new TransientStatusView(container);
    view.show('В процессе');

    view.destroy();
    vi.runAllTimers();

    expect(container.textContent).toBe('В процессе');
  });
});
