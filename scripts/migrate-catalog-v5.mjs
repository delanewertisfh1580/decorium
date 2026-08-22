import { readFile, writeFile } from 'node:fs/promises';

const root = '/home/ubuntu/decorium';
const source = JSON.parse(await readFile(`${root}/data/items/catalog.v4.json`, 'utf8'));
const visualByType = {
  sofa: { materialId: 'textile', color: '#8d725f' },
  chair: { materialId: 'oak-light', color: '#a97956' },
  table: { materialId: 'oak-light', color: '#9c7251' },
  bed: { materialId: 'textile', color: '#647b92' },
  storage: { materialId: 'oak-light', color: '#8b654b' },
  lighting: { materialId: 'brass', color: '#c79b55' },
  decor: { materialId: 'ceramic', color: '#78939b' },
  media: { materialId: 'graphite', color: '#273347' }
};
const accentByType = {
  sofa: { materialId: 'velvet', color: '#405d59' },
  chair: { materialId: 'walnut', color: '#604430' },
  table: { materialId: 'walnut', color: '#594035' },
  bed: { materialId: 'linen', color: '#9a745e' },
  storage: { materialId: 'walnut', color: '#5f4635' },
  lighting: { materialId: 'black-metal', color: '#2d3440' },
  decor: { materialId: 'terracotta', color: '#b36e50' },
  media: { materialId: 'midnight-metal', color: '#172131' }
};
const compactUnlockByType = { sofa: 'size-compact', chair: 'size-compact', table: 'size-compact', bed: 'size-compact', storage: 'size-compact', lighting: 'size-compact', decor: 'size-compact', media: 'size-compact' };
const labelByType = { sofa: 'Акцентный материал', chair: 'Акцентный материал', table: 'Акцентный материал', bed: 'Акцентный материал', storage: 'Акцентный материал', lighting: 'Акцентный материал', decor: 'Акцентный материал', media: 'Акцентный материал' };
const catalog = {
  schemaVersion: 5,
  items: source.items.map(item => {
    const base = visualByType[item.type] ?? visualByType.decor;
    const accent = accentByType[item.type] ?? accentByType.decor;
    return {
      ...item,
      baseVariantId: 'base',
      variants: [
        { id: 'base', label: 'Базовый', unlockId: 'base-interior', visual: { ...base, assetId: null, scale: 1 } },
        { id: 'accent', label: labelByType[item.type] ?? 'Акцентный материал', unlockId: 'material-artisan', visual: { ...accent, assetId: null, scale: 1 } },
        { id: 'compact', label: 'Компактный размер', unlockId: compactUnlockByType[item.type] ?? 'size-compact', visual: { ...base, assetId: null, scale: 0.85 }, dimensions: { x: Math.max(0.1, Number((item.dimensions.x * 0.85).toFixed(3))), z: Math.max(0.05, Number((item.dimensions.z * 0.85).toFixed(3))) } }
      ]
    };
  })
};
await writeFile(`${root}/data/items/catalog.v5.json`, `${JSON.stringify(catalog, null, 2)}\n`);
