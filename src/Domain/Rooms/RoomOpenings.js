import PassageZone from '../Ergonomics/PassageZone.js';

/**
 * Authored opening presets shared by presentation rendering and gameplay rules.
 * Single source of truth: what the player sees as a door/window is exactly
 * what the ergonomics evaluation protects. Styling fields (color, glassOpacity)
 * are inert authored data consumed by the presentation layer.
 */
export const OPENING_PRESETS = Object.freeze({
  'living-window-and-door': Object.freeze({
    window: Object.freeze({ widthFactor: 0.34, centerXFactor: 0.68, height: 1.35, bottom: 1.25, glassOpacity: 0.24, maxWidth: 2.15 }),
    door: Object.freeze({ centerZFactor: 0.72, width: 0.9, color: 0x394b52 })
  }),
  'media-narrow-window': Object.freeze({
    window: Object.freeze({ widthFactor: 0.24, centerXFactor: 0.24, height: 1.05, bottom: 1.5, glassOpacity: 0.18, maxWidth: 1.45 }),
    door: Object.freeze({ centerZFactor: 0.76, width: 0.82, color: 0x242b34 })
  }),
  'studio-wide-window': Object.freeze({
    window: Object.freeze({ widthFactor: 0.56, centerXFactor: 0.56, height: 1.72, bottom: 0.92, glassOpacity: 0.3, maxWidth: 5.4 }),
    door: Object.freeze({ centerZFactor: 0.24, width: 1.0, color: 0x6f665c })
  })
});

const DOOR_WALL = 'left';
const WINDOW_WALL = 'back';
const DOOR_CLEARANCE_M = 0.9;
const DOOR_MARGIN_M = 0.05;
const WINDOW_CLEARANCE_M = 0.45;

function requireRoomDimensions(width, depth) {
  if (typeof width !== 'number' || typeof depth !== 'number'
    || !Number.isFinite(width) || !Number.isFinite(depth) || width <= 0 || depth <= 0) {
    throw new Error(`RoomOpenings: room dimensions must be positive numbers, got ${width}x${depth}`);
  }
}

export function openingPresetById(presetId) {
  const preset = OPENING_PRESETS[presetId];
  if (!preset) throw new Error(`RoomOpenings: unsupported openings preset '${presetId}'`);
  return preset;
}

function requirePreset(preset) {
  if (!preset?.window || !preset?.door) {
    throw new Error('RoomOpenings: preset must provide window and door definitions');
  }
  return preset;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Resolves the concrete opening geometry for a rectangular room from an
 * authored preset. Pure function: identical inputs always produce identical
 * frozen output. The window sits in the back wall (z = depth), the door in
 * the left wall (x = 0).
 */
export function resolveRoomOpenings({ width, depth, wallHeight = 3.2, preset }) {
  requireRoomDimensions(width, depth);
  const openingPreset = requirePreset(preset);

  const windowWidth = Math.min(openingPreset.window.maxWidth, width * openingPreset.window.widthFactor);
  const windowCenterX = clamp(width * openingPreset.window.centerXFactor, windowWidth / 2, width - windowWidth / 2);
  const windowBottom = Math.min(openingPreset.window.bottom, Math.max(0.35, wallHeight - 0.7));
  const windowHeight = Math.min(openingPreset.window.height, wallHeight - windowBottom - 0.08);

  const doorWidth = Math.min(depth * 0.6, openingPreset.door.width);
  const doorCenterZ = clamp(depth * openingPreset.door.centerZFactor, doorWidth / 2, depth - doorWidth / 2);

  return Object.freeze({
    window: Object.freeze({
      wall: WINDOW_WALL,
      centerX: windowCenterX,
      width: windowWidth,
      bottom: windowBottom,
      top: windowBottom + windowHeight,
      height: windowHeight,
      glassOpacity: openingPreset.window.glassOpacity
    }),
    door: Object.freeze({
      wall: DOOR_WALL,
      centerZ: doorCenterZ,
      width: doorWidth,
      height: Math.min(2.2, wallHeight - 0.45),
      color: openingPreset.door.color
    })
  });
}

/**
 * Floor-plan rectangles that must stay free of furniture so every opening
 * remains usable: a swing/approach area in front of the door and a light
 * strip along the window wall.
 */
export function openingClearanceRects({ width, depth, presetId }) {
  const openings = resolveRoomOpenings({ width, depth, preset: openingPresetById(presetId) });
  const { door, window: windowOpening } = openings;
  return Object.freeze([
    Object.freeze({
      kind: 'door',
      x: 0,
      z: door.centerZ - door.width / 2 - DOOR_MARGIN_M,
      width: DOOR_CLEARANCE_M,
      depth: door.width + DOOR_MARGIN_M * 2
    }),
    Object.freeze({
      kind: 'window',
      x: windowOpening.centerX - windowOpening.width / 2,
      z: depth - WINDOW_CLEARANCE_M,
      width: windowOpening.width,
      depth: WINDOW_CLEARANCE_M
    })
  ]);
}

/**
 * Maps opening clearance rectangles onto PassageZone constraints so the
 * existing ergonomics pipeline evaluates them without a dedicated evaluator.
 */
export function createOpeningPassageZones({ width, depth, presetId }) {
  const labels = Object.freeze({
    door: Object.freeze({ label: 'Проход у двери', messageKey: 'ergonomics-opening-door-free', weight: 1.4 }),
    window: Object.freeze({ label: 'Зона перед окном', messageKey: 'ergonomics-opening-window-free', weight: 1 })
  });
  return Object.freeze(openingClearanceRects({ width, depth, presetId }).map(rect => new PassageZone({
    id: `opening-${rect.kind}`,
    label: labels[rect.kind].label,
    x: rect.x,
    z: rect.z,
    width: rect.width,
    depth: rect.depth,
    weight: labels[rect.kind].weight,
    messageKey: labels[rect.kind].messageKey
  })));
}
