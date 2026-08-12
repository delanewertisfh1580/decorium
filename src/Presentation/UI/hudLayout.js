const freeze = value => Object.freeze(value);

export const HUD_LAYOUT = freeze({
  referenceSurface: 'scene-first',
  regions: freeze({
    brand: 'top-left',
    summary: 'top-right',
    inventory: 'bottom-left',
    actions: 'bottom-right'
  }),
  maxPanelOpacity: 0.88,
  controlMinHeight: 44,
  actionLabelSize: 16,
  inventoryCardWidth: 144,
  mobileBreakpoint: 720,
  safeAreaPadding: 12,
  catalogCollapsedByDefault: true,
  scoreCollapsedByDefault: true,
  helpCollapsedByDefault: true,
  contextualHintsOnly: true
});

export function validateHudLayout(layout) {
  const errors = [];
  const requiredRegions = ['brand', 'summary', 'inventory', 'actions'];

  if (layout?.referenceSurface !== 'scene-first') errors.push('referenceSurface');
  if (!layout?.regions || requiredRegions.some(region => !layout.regions[region])) errors.push('regions');
  if (!Number.isFinite(layout?.maxPanelOpacity) || layout.maxPanelOpacity > 0.9) errors.push('maxPanelOpacity');
  if (!Number.isFinite(layout?.controlMinHeight) || layout.controlMinHeight < 44) errors.push('controlMinHeight');
  if (!Number.isFinite(layout?.actionLabelSize) || layout.actionLabelSize > 16) errors.push('actionLabelSize');
  if (!Number.isFinite(layout?.inventoryCardWidth) || layout.inventoryCardWidth < 132) errors.push('inventoryCardWidth');
  if (!Number.isFinite(layout?.mobileBreakpoint) || layout.mobileBreakpoint < 560) errors.push('mobileBreakpoint');
  if (layout?.catalogCollapsedByDefault !== true) errors.push('catalogCollapsedByDefault');
  if (layout?.scoreCollapsedByDefault !== true) errors.push('scoreCollapsedByDefault');
  if (layout?.helpCollapsedByDefault !== true) errors.push('helpCollapsedByDefault');
  if (layout?.contextualHintsOnly !== true) errors.push('contextualHintsOnly');

  return errors;
}

export default HUD_LAYOUT;
