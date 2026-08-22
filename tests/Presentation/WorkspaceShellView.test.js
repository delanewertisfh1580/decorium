// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceShellView } from '../../src/Presentation/Views/WorkspaceShellView.js';
import { WORKSPACE_DRAWERS, WorkspaceState } from '../../src/Presentation/UI/WorkspaceState.js';

describe('WorkspaceShellView', () => {
  it('renders one app bar and one command dock instead of independent corner navigation panels', () => {
    const container = document.createElement('div');
    const view = new WorkspaceShellView(container, {});

    view.render({
      state: WorkspaceState.edit(),
      levelLabel: 'Гостиная · Первые шаги',
      placedCount: 5,
      canUndo: true
    });

    expect(container.querySelector('[data-workspace-app-bar]')).not.toBeNull();
    expect(container.querySelector('[data-workspace-command-dock]')).not.toBeNull();
    expect(container.querySelector('[data-workspace-drawer]')).not.toBeNull();
    expect(container.querySelector('[data-workspace-action="catalog"]')).not.toBeNull();
    expect(container.querySelector('[data-workspace-action="evaluate"]')).not.toBeNull();
    expect(container.querySelector('[data-workspace-action="undo"]')).not.toBeNull();
    expect(container.querySelector('[data-workspace-action="undo"]').disabled).toBe(false);
  });

  it('routes app-bar and dock controls through explicit callbacks without deriving gameplay policy', () => {
    const onCampaign = vi.fn();
    const onBrief = vi.fn();
    const onCatalog = vi.fn();
    const onUndo = vi.fn();
    const onEvaluate = vi.fn();
    const container = document.createElement('div');
    const view = new WorkspaceShellView(container, { onCampaign, onBrief, onCatalog, onUndo, onEvaluate });

    view.render({ state: WorkspaceState.edit(), levelLabel: 'Гостиная', placedCount: 0, canUndo: false });
    container.querySelector('[data-workspace-action="campaign"]').click();
    container.querySelector('[data-workspace-action="brief"]').click();
    container.querySelector('[data-workspace-action="catalog"]').click();
    container.querySelector('[data-workspace-action="undo"]').click();
    container.querySelector('[data-workspace-action="evaluate"]').click();

    expect(onCampaign).toHaveBeenCalledTimes(1);
    expect(onBrief).toHaveBeenCalledTimes(1);
    expect(onCatalog).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
    expect(onEvaluate).toHaveBeenCalledTimes(1);
  });

  it('provides separate persistent mounts for catalog, brief and inspector drawers', () => {
    const container = document.createElement('div');
    const view = new WorkspaceShellView(container, {});
    view.render({ state: WorkspaceState.edit(), levelLabel: 'Гостиная', placedCount: 1, canUndo: false });

    expect(view.catalogContainer).not.toBeNull();
    expect(view.briefContainer).not.toBeNull();
    expect(view.inspectorContainer).not.toBeNull();
    expect(view.catalogContainer).not.toBe(view.briefContainer);
    expect(view.briefContainer).not.toBe(view.inspectorContainer);
  });

  it('preserves the drawer mount across state refreshes so nested views keep their continuity state', () => {
    const container = document.createElement('div');
    const view = new WorkspaceShellView(container, {});
    view.render({ state: WorkspaceState.edit(), levelLabel: 'Гостиная', placedCount: 1, canUndo: false });
    const drawer = view.drawerContainer;
    drawer.innerHTML = '<input value="сохранить поиск">';

    view.render({ state: WorkspaceState.edit().openDrawer(WORKSPACE_DRAWERS.CATALOG), levelLabel: 'Гостиная', placedCount: 2, canUndo: true });

    expect(view.drawerContainer).toBe(drawer);
    expect(view.drawerContainer.querySelector('input').value).toBe('сохранить поиск');
  });

  it('uses state data attributes to expose exactly one active drawer and hides edit chrome in review', () => {
    const container = document.createElement('div');
    const view = new WorkspaceShellView(container, {});

    view.render({
      state: WorkspaceState.edit().openDrawer(WORKSPACE_DRAWERS.CATALOG),
      levelLabel: 'Гостиная',
      placedCount: 2,
      canUndo: false
    });
    expect(container.dataset.workspaceScreen).toBe('edit');
    expect(container.dataset.activeDrawer).toBe('catalog');

    view.render({ state: WorkspaceState.edit().openReview(), levelLabel: 'Гостиная', placedCount: 2, canUndo: false });
    expect(container.dataset.workspaceScreen).toBe('review');
    expect(container.querySelector('[data-workspace-command-dock]').hidden).toBe(true);
  });
});
