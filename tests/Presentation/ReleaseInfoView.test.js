// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { ReleaseInfoView } from '../../src/Presentation/Views/ReleaseInfoView.js';

const buildInfo = {
  releaseVersion: '1.0.0',
  sourceRevision: '9e49e788ecf335a8f87f38486c08ed5a8e7f6ce1',
  channel: 'web'
};

describe('ReleaseInfoView', () => {
  it('renders a concise, support-safe release identity without exposing timestamps or user data', () => {
    const container = document.createElement('aside');
    const view = new ReleaseInfoView(container);

    view.renderAvailable(buildInfo);

    const info = container.querySelector('[data-release-info]');
    expect(info.textContent).toContain('v1.0.0');
    expect(info.textContent).toContain('web');
    expect(info.textContent).toContain('9e49e78');
    expect(info.textContent).not.toContain('2026');
    expect(info.getAttribute('aria-label')).toContain('Версия игры');
  });

  it('renders a non-blocking unavailable state when release information cannot load', () => {
    const container = document.createElement('aside');
    const view = new ReleaseInfoView(container);

    view.renderUnavailable();

    expect(container.textContent).toContain('Сведения о версии недоступны');
    expect(container.querySelector('[data-release-info]').getAttribute('role')).toBe('status');
  });
});
