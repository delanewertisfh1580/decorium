export function getFixtureLayout(width, depth) {
  return {
    clearance: 0.18,
    tv: { centerX: width * 0.24, width: 1.75, z: depth - 0.13 },
    bookshelf: { centerX: width * 0.52, width: 1.15, z: depth - 0.14 },
    mirror: { centerX: width * 0.86, width: 0.78, z: depth - 0.1 }
  };
}

export function validateFixtureLayout(layout, width, depth) {
  const errors = [];
  const tvRight = (layout?.tv?.centerX ?? 0) + (layout?.tv?.width ?? 0) / 2;
  const shelfLeft = (layout?.bookshelf?.centerX ?? 0) - (layout?.bookshelf?.width ?? 0) / 2;

  if (!layout?.tv || !layout?.bookshelf || !layout?.mirror) errors.push('fixtures');
  if (shelfLeft - tvRight < (layout?.clearance ?? 0)) errors.push('overlap');

  for (const key of ['tv', 'bookshelf', 'mirror']) {
    const fixture = layout?.[key];
    if (!fixture || fixture.centerX - fixture.width / 2 <= 0 || fixture.centerX + fixture.width / 2 >= width || fixture.z <= 0 || fixture.z >= depth) {
      if (!errors.includes('bounds')) errors.push('bounds');
    }
  }

  return errors;
}

export default getFixtureLayout;
