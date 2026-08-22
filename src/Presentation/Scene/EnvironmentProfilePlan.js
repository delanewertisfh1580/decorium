const PRESETS = Object.freeze({
  openings: Object.freeze({
    'living-window-and-door': Object.freeze({ window: Object.freeze({ widthFactor: 0.34, centerXFactor: 0.68, height: 1.35, bottom: 1.25, glassOpacity: 0.24, maxWidth: 2.15 }), door: Object.freeze({ centerZFactor: 0.72, width: 0.9, color: 0x394b52 }) }),
    'media-narrow-window': Object.freeze({ window: Object.freeze({ widthFactor: 0.24, centerXFactor: 0.24, height: 1.05, bottom: 1.5, glassOpacity: 0.18, maxWidth: 1.45 }), door: Object.freeze({ centerZFactor: 0.76, width: 0.82, color: 0x242b34 }) }),
    'studio-wide-window': Object.freeze({ window: Object.freeze({ widthFactor: 0.56, centerXFactor: 0.56, height: 1.72, bottom: 0.92, glassOpacity: 0.3, maxWidth: 5.4 }), door: Object.freeze({ centerZFactor: 0.24, width: 1.0, color: 0x6f665c }) })
  }),
  cameras: Object.freeze({
    'compact-living': Object.freeze({ xFactor: 1.16, zFactor: 1.34, heightFactor: 1.1, minHeight: 5.4, targetHeight: 0.8 }),
    'intimate-media': Object.freeze({ xFactor: 1.06, zFactor: 1.2, heightFactor: 1.0, minHeight: 4.9, targetHeight: 0.76 }),
    'open-studio': Object.freeze({ xFactor: 1.22, zFactor: 1.42, heightFactor: 1.16, minHeight: 6.2, targetHeight: 0.86 })
  }),
  lighting: Object.freeze({
    'warm-evening': Object.freeze({ background: 0x172131, fog: 0x172131, hemisphereSky: 0xbad7ff, hemisphereGround: 0x202938, hemisphereIntensity: 1.9, key: 0xffe8c7, keyIntensity: 3.2, rim: 0x5799f4, rimIntensity: 15, warm: 0xffb46d, warmIntensity: 7 }),
    'media-dusk': Object.freeze({ background: 0x111925, fog: 0x111925, hemisphereSky: 0x6c82ab, hemisphereGround: 0x242b37, hemisphereIntensity: 1.85, key: 0xd8ad89, keyIntensity: 3.1, rim: 0xa488ec, rimIntensity: 13.5, warm: 0xee9770, warmIntensity: 5.25 }),
    'bright-daylight': Object.freeze({ background: 0xcbd5dd, fog: 0xcbd5dd, hemisphereSky: 0xdcecff, hemisphereGround: 0x7f796e, hemisphereIntensity: 2.25, key: 0xfff4d8, keyIntensity: 3.8, rim: 0x9dc2dc, rimIntensity: 10, warm: 0xf5d9a4, warmIntensity: 4.2 })
  }),
  exteriors: Object.freeze({
    'quiet-residential-street': Object.freeze({ kind: 'quiet-residential-street', facadeColor: 0x76675e, roadColor: 0x28333c, sidewalkColor: 0x967e70, foliageColor: 0x587865, routeScale: 1 }),
    'urban-evening': Object.freeze({ kind: 'urban-evening', facadeColor: 0x3c4657, roadColor: 0x1b202a, sidewalkColor: 0x665c62, foliageColor: 0x374c52, routeScale: 0.65 }),
    'courtyard-daylight': Object.freeze({ kind: 'courtyard-daylight', facadeColor: 0xc5c7bd, roadColor: 0x777c78, sidewalkColor: 0xb9aa94, foliageColor: 0x6f946c, routeScale: 0.45 })
  }),
  exteriorCompositions: Object.freeze({
    'residential-porch': Object.freeze({ kind: 'residential-porch', facadeInsetColor: 0x8d7668, accentColor: 0xc49c6d, foliageScale: 1.05 }),
    'urban-cinema-block': Object.freeze({ kind: 'urban-cinema-block', facadeInsetColor: 0x202939, accentColor: 0xc46d67, foliageScale: 0.62 }),
    'courtyard-workshop': Object.freeze({ kind: 'courtyard-workshop', facadeInsetColor: 0xd3c9b7, accentColor: 0xd29f64, foliageScale: 1.24 })
  }),
  sceneLife: Object.freeze({
    'calm-indoor-evening': Object.freeze({ moteCount: 14, petEnabled: false, routeScale: 1 }),
    'quiet-media-dusk': Object.freeze({ moteCount: 7, petEnabled: false, routeScale: 0.65 }),
    'studio-daylight': Object.freeze({ moteCount: 20, petEnabled: false, routeScale: 0.45 })
  })
});

function requirePreset(group, id) {
  const preset = PRESETS[group][id];
  if (!preset) throw new Error(`Presentation environment profile uses unsupported ${group} preset: ${id}`);
  return preset;
}

export function resolveEnvironmentProfilePlan(profile) {
  const room = profile?.room;
  if (!profile?.id || !room?.openingsPreset || !room?.cameraPreset || !room?.exteriorCompositionPreset
    || !profile?.lightingPreset || !profile?.exteriorPreset || !profile?.sceneLifePreset) {
    throw new Error('Presentation environment profile is incomplete.');
  }
  return Object.freeze({
    id: profile.id,
    openings: requirePreset('openings', room.openingsPreset),
    camera: requirePreset('cameras', room.cameraPreset),
    lighting: requirePreset('lighting', profile.lightingPreset),
    exterior: requirePreset('exteriors', profile.exteriorPreset),
    exteriorComposition: requirePreset('exteriorCompositions', room.exteriorCompositionPreset),
    sceneLife: requirePreset('sceneLife', profile.sceneLifePreset),
    presentation: Object.freeze({ ...profile.presentation })
  });
}

export default resolveEnvironmentProfilePlan;
