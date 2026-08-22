import { describe, expect, it } from 'vitest';
import {
  WORKSPACE_DRAWERS,
  WORKSPACE_SCREENS,
  WorkspaceState
} from '../../src/Presentation/UI/WorkspaceState.js';

describe('WorkspaceState', () => {
  it('starts in edit with no active drawer and opens exactly one edit drawer at a time', () => {
    const initial = WorkspaceState.edit();
    const catalog = initial.openDrawer(WORKSPACE_DRAWERS.CATALOG);
    const inspector = catalog.openDrawer(WORKSPACE_DRAWERS.INSPECTOR_ITEM);

    expect(initial).toMatchObject({ screen: WORKSPACE_SCREENS.EDIT, activeDrawer: WORKSPACE_DRAWERS.NONE });
    expect(catalog).toMatchObject({ screen: WORKSPACE_SCREENS.EDIT, activeDrawer: WORKSPACE_DRAWERS.CATALOG });
    expect(inspector).toMatchObject({ screen: WORKSPACE_SCREENS.EDIT, activeDrawer: WORKSPACE_DRAWERS.INSPECTOR_ITEM });
    expect(Object.isFrozen(inspector)).toBe(true);
  });

  it('keeps brief, review and campaign as full workspace modes without a competing drawer', () => {
    const brief = WorkspaceState.edit().openBrief();
    const review = brief.openReview();
    const campaign = review.openCampaign();

    expect(brief).toMatchObject({ screen: WORKSPACE_SCREENS.BRIEF, activeDrawer: WORKSPACE_DRAWERS.NONE });
    expect(review).toMatchObject({ screen: WORKSPACE_SCREENS.REVIEW, activeDrawer: WORKSPACE_DRAWERS.NONE });
    expect(campaign).toMatchObject({ screen: WORKSPACE_SCREENS.CAMPAIGN, activeDrawer: WORKSPACE_DRAWERS.NONE });
  });

  it('closes the topmost edit surface before returning from a full workspace mode', () => {
    const catalog = WorkspaceState.edit().openDrawer(WORKSPACE_DRAWERS.CATALOG);

    expect(catalog.dismiss()).toMatchObject({ screen: WORKSPACE_SCREENS.EDIT, activeDrawer: WORKSPACE_DRAWERS.NONE });
    expect(WorkspaceState.edit().openBrief().dismiss()).toMatchObject({ screen: WORKSPACE_SCREENS.EDIT, activeDrawer: WORKSPACE_DRAWERS.NONE });
    expect(WorkspaceState.edit().openReview().dismiss()).toMatchObject({ screen: WORKSPACE_SCREENS.EDIT, activeDrawer: WORKSPACE_DRAWERS.NONE });
  });

  it('rejects invalid screens and invalid drawer combinations instead of relying on CSS visibility', () => {
    expect(() => new WorkspaceState({ screen: 'unknown', activeDrawer: WORKSPACE_DRAWERS.NONE })).toThrow('screen');
    expect(() => new WorkspaceState({ screen: WORKSPACE_SCREENS.REVIEW, activeDrawer: WORKSPACE_DRAWERS.CATALOG })).toThrow('drawer');
    expect(() => WorkspaceState.edit().openDrawer('settings')).toThrow('drawer');
  });
});
