export const WORKSPACE_SCREENS = Object.freeze({
  CAMPAIGN: 'campaign',
  BRIEF: 'brief',
  EDIT: 'edit',
  REVIEW: 'review'
});

export const WORKSPACE_DRAWERS = Object.freeze({
  NONE: 'none',
  CATALOG: 'catalog',
  BRIEF: 'brief',
  INSPECTOR_ITEM: 'inspector-item',
  INSPECTOR_ROOM: 'inspector-room'
});

const FULL_WORKSPACE_SCREENS = new Set([
  WORKSPACE_SCREENS.CAMPAIGN,
  WORKSPACE_SCREENS.BRIEF,
  WORKSPACE_SCREENS.REVIEW
]);
const DRAWER_VALUES = new Set(Object.values(WORKSPACE_DRAWERS));
const SCREEN_VALUES = new Set(Object.values(WORKSPACE_SCREENS));

/**
 * Immutable UI state for mutually exclusive app workspaces and edit drawers.
 * It deliberately models UI visibility independently from gameplay/domain state.
 */
export class WorkspaceState {
  constructor({ screen = WORKSPACE_SCREENS.EDIT, activeDrawer = WORKSPACE_DRAWERS.NONE } = {}) {
    if (!SCREEN_VALUES.has(screen)) {
      throw new Error('WorkspaceState screen is not supported');
    }
    if (!DRAWER_VALUES.has(activeDrawer)) {
      throw new Error('WorkspaceState drawer is not supported');
    }
    if (FULL_WORKSPACE_SCREENS.has(screen) && activeDrawer !== WORKSPACE_DRAWERS.NONE) {
      throw new Error('WorkspaceState drawer must be none outside edit');
    }
    this.screen = screen;
    this.activeDrawer = activeDrawer;
    Object.freeze(this);
  }

  static edit() {
    return new WorkspaceState();
  }

  openDrawer(activeDrawer) {
    if (this.screen !== WORKSPACE_SCREENS.EDIT) {
      return new WorkspaceState({ screen: WORKSPACE_SCREENS.EDIT, activeDrawer });
    }
    return new WorkspaceState({ screen: this.screen, activeDrawer });
  }

  openBrief() {
    return new WorkspaceState({ screen: WORKSPACE_SCREENS.BRIEF });
  }

  openReview() {
    return new WorkspaceState({ screen: WORKSPACE_SCREENS.REVIEW });
  }

  openCampaign() {
    return new WorkspaceState({ screen: WORKSPACE_SCREENS.CAMPAIGN });
  }

  dismiss() {
    if (this.activeDrawer !== WORKSPACE_DRAWERS.NONE) {
      return new WorkspaceState({ screen: WORKSPACE_SCREENS.EDIT });
    }
    if (this.screen !== WORKSPACE_SCREENS.EDIT) {
      return new WorkspaceState({ screen: WORKSPACE_SCREENS.EDIT });
    }
    return this;
  }
}

export default WorkspaceState;
