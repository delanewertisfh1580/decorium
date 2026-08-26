const DEFAULT_ITEM_VARIANTS = Object.freeze([
  Object.freeze({
    id: 'light',
    label: 'Светлый цвет',
    unlockId: 'base-interior',
    visual: Object.freeze({ materialId: 'oak-light', color: '#e8dccb', assetId: null, scale: 1 })
  }),
  Object.freeze({
    id: 'sage',
    label: 'Шалфейный текстиль',
    unlockId: 'base-interior',
    visual: Object.freeze({ materialId: 'textile', color: '#789b8c', assetId: null, scale: 1 })
  }),
  Object.freeze({
    id: 'charcoal',
    label: 'Графитовый цвет',
    unlockId: 'base-interior',
    visual: Object.freeze({ materialId: 'black-metal', color: '#29323d', assetId: null, scale: 1 })
  }),
  Object.freeze({
    id: 'wide',
    label: 'Увеличенный формат',
    unlockId: 'base-interior',
    visual: Object.freeze({ materialId: 'oak-light', color: '#a97956', assetId: null, scale: 1.15 })
  }),
  Object.freeze({
    id: 'slim',
    label: 'Компактный размер',
    unlockId: 'base-interior',
    visual: Object.freeze({ materialId: 'oak-light', color: '#a97956', assetId: null, scale: 0.72 })
  })
]);

/**
 * Returns content defaults without replacing item-specific authored variants.
 * Authors can override any default by using the same variant id in the item.
 */
export function mergeDefaultItemVariants(variants = []) {
  const authored = Array.isArray(variants) ? variants : [];
  const authoredIds = new Set(authored.map(variant => variant?.id));
  return Object.freeze([
    ...authored,
    ...DEFAULT_ITEM_VARIANTS.filter(variant => !authoredIds.has(variant.id))
  ]);
}

export { DEFAULT_ITEM_VARIANTS };
export default DEFAULT_ITEM_VARIANTS;
