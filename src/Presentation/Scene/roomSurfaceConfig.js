const freeze = value => Object.freeze(value);

export const ROOM_SURFACE_CONFIG = freeze({
  gridVisible: false,
  style: 'matte-warm',
  color: 0x8c766a,
  roughness: 0.94,
  receiveShadow: true
});

export function validateRoomSurface(config) {
  const errors = [];
  if (config?.gridVisible !== false) errors.push('gridVisible');
  if (config?.style !== 'matte-warm') errors.push('style');
  if (!Number.isFinite(config?.color)) errors.push('color');
  if (!Number.isFinite(config?.roughness) || config.roughness < 0.8 || config.roughness > 1) errors.push('roughness');
  return errors;
}

export default ROOM_SURFACE_CONFIG;
