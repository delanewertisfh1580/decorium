const freeze = value => Object.freeze(value);

export const LIFE_ANIMATION_CONFIG = freeze({
  gaits: freeze({
    pedestrian: freeze({
      strideFrequency: 1.8,
      legSwing: 0.18,
      armSwing: 0.13,
      bodyBob: 0.012,
      bodySway: 0.018
    }),
    animal: freeze({
      strideFrequency: 2.8,
      legSwing: 0.25,
      bodyBob: 0.024,
      bodySway: 0.025,
      tailFrequency: 1.6,
      tailSwing: 0.2
    })
  }),
  television: freeze({
    cycleSeconds: 4.8,
    barCount: 4,
    barTravel: 0.09,
    contentBlockCount: 3,
    contentTravel: 0.16,
    scanlineFrequency: 1.8,
    glowMin: 0.72,
    glowMax: 1.08
  })
});

function cycle(seconds, frequency, phase = 0) {
  return seconds * frequency * Math.PI * 2 + phase * Math.PI * 2;
}

function boundedSine(value, amplitude) {
  return Math.sin(value) * amplitude;
}

export function getGaitPose(seconds, phase = 0, kind = 'pedestrian') {
  const profile = LIFE_ANIMATION_CONFIG.gaits[kind] ?? LIFE_ANIMATION_CONFIG.gaits.pedestrian;
  const stride = cycle(seconds, profile.strideFrequency, phase);
  const legWave = Math.sin(stride);
  const legSwing = profile.legSwing;
  const legs = kind === 'animal'
    ? [legWave * legSwing, -legWave * legSwing, -legWave * legSwing, legWave * legSwing]
    : [legWave * legSwing, -legWave * legSwing];
  const arms = kind === 'animal'
    ? []
    : [
      -boundedSine(stride, profile.armSwing),
      boundedSine(stride, profile.armSwing)
    ];

  return {
    legs,
    arms,
    bodyBob: Math.abs(legWave) * profile.bodyBob,
    bodySway: boundedSine(stride * 0.5, profile.bodySway),
    tailSwing: kind === 'animal'
      ? boundedSine(cycle(seconds, profile.tailFrequency, phase), profile.tailSwing)
      : 0
  };
}

export function getRouteMotion(seconds, route) {
  const direction = Math.sign(route.end - route.start) || 1;
  const progress = ((seconds * route.speed + route.phase) % 1 + 1) % 1;
  return { progress, direction };
}

export function getTelevisionMotion(seconds) {
  const profile = LIFE_ANIMATION_CONFIG.television;
  const frame = ((seconds % profile.cycleSeconds) + profile.cycleSeconds) % profile.cycleSeconds / profile.cycleSeconds;
  const phase = frame * Math.PI * 2;
  const barOffsets = Array.from({ length: profile.barCount }, (_, index) => (
    Math.sin(phase * (1 + index * 0.08) + index * 1.4) * profile.barTravel
  ));
  const contentOffsets = Array.from({ length: profile.contentBlockCount }, (_, index) => (
    Math.sin(phase * (0.72 + index * 0.12) + index * 2.1) * profile.contentTravel
  ));
  const scanline = (Math.sin(seconds * profile.scanlineFrequency * Math.PI * 2) + 1) / 2;
  const glow = profile.glowMin + scanline * (profile.glowMax - profile.glowMin);

  return {
    frame,
    barOffsets,
    contentOffsets,
    scanline,
    glow
  };
}

export default LIFE_ANIMATION_CONFIG;
