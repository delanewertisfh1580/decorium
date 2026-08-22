const freeze = value => Object.freeze(value);

export const HUD_LAYOUT = freeze({
  referenceSurface: 'workspace',
  regions: freeze({
    appBar: 'top',
    drawer: 'contextual',
    commandDock: 'bottom',
    review: 'modal'
  }),
  maxPanelOpacity: 0.96,
  controlMinHeight: 44,
  actionLabelSize: 16,
  mobileBreakpoint: 720,
  safeAreaPadding: 12,
  singleActiveDrawer: true,
  briefIsStandalone: true,
  reviewIsStandalone: true,
  contextualInspector: true
});

export function validateHudLayout(layout) {
  const errors = [];
  const requiredRegions = ['appBar', 'drawer', 'commandDock', 'review'];

  if (layout?.referenceSurface !== 'workspace') errors.push('referenceSurface');
  if (!layout?.regions || requiredRegions.some(region => !layout.regions[region])) errors.push('regions');
  if (!Number.isFinite(layout?.maxPanelOpacity) || layout.maxPanelOpacity < 0.92 || layout.maxPanelOpacity > 1) errors.push('maxPanelOpacity');
  if (!Number.isFinite(layout?.controlMinHeight) || layout.controlMinHeight < 44) errors.push('controlMinHeight');
  if (!Number.isFinite(layout?.actionLabelSize) || layout.actionLabelSize > 16) errors.push('actionLabelSize');
  if (!Number.isFinite(layout?.mobileBreakpoint) || layout.mobileBreakpoint < 560) errors.push('mobileBreakpoint');
  if (layout?.singleActiveDrawer !== true) errors.push('singleActiveDrawer');
  if (layout?.briefIsStandalone !== true) errors.push('briefIsStandalone');
  if (layout?.reviewIsStandalone !== true) errors.push('reviewIsStandalone');
  if (layout?.contextualInspector !== true) errors.push('contextualInspector');

  return errors;
}

export default HUD_LAYOUT;
