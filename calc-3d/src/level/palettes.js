export const STYLE_PALETTES = {
    scandinavian: {
        floor: { color: 0xd2b48c, roughness: 0.8, metalness: 0.0 },
        walls: { color: 0xf5f5f5, roughness: 0.9, metalness: 0.0 },
        ceiling: { color: 0xffffff, roughness: 1.0, metalness: 0.0 },
        baseboard: { color: 0xffffff, roughness: 0.5, metalness: 0.0 },
        door: { color: 0xe0e0e0, roughness: 0.6, metalness: 0.0 }
    },
    loft: {
        floor: { color: 0x8b8b8b, roughness: 0.6, metalness: 0.2 },
        walls: { color: 0xa0522d, roughness: 0.9, metalness: 0.0 },
        ceiling: { color: 0x404040, roughness: 0.8, metalness: 0.3 },
        baseboard: { color: 0x202020, roughness: 0.4, metalness: 0.5 },
        door: { color: 0x303030, roughness: 0.5, metalness: 0.4 }
    },
    modern: {
        floor: { color: 0xe8e8e8, roughness: 0.2, metalness: 0.1 },
        walls: { color: 0xfafafa, roughness: 0.5, metalness: 0.0 },
        ceiling: { color: 0xffffff, roughness: 0.5, metalness: 0.0 },
        baseboard: { color: 0xcccccc, roughness: 0.3, metalness: 0.2 },
        door: { color: 0xd0d0d0, roughness: 0.3, metalness: 0.1 }
    }
};

export function getPalette(styleId) {
    return STYLE_PALETTES[styleId] || STYLE_PALETTES.scandinavian;
}