const freeze = value => Object.freeze(value);

export const LOCATION_LIFE_CONFIG = freeze({
  environment: freeze(['facade', 'sidewalk', 'road']),
  routes: freeze([
    freeze({ kind: 'pedestrian', lane: 'sidewalk', start: -0.22, end: 1.22, speed: 0.055, phase: 0.12, variant: 'green-coat' }),
    freeze({ kind: 'pedestrian', lane: 'sidewalk', start: -0.22, end: 1.22, speed: 0.043, phase: 0.62, variant: 'cream-coat' }),
    freeze({ kind: 'car', lane: 'road-near', start: -0.3, end: 1.3, speed: 0.034, phase: 0.28, variant: 'sage' }),
    freeze({ kind: 'car', lane: 'road-far', start: -0.3, end: 1.3, speed: 0.026, phase: 0.76, variant: 'ochre' }),
    freeze({ kind: 'animal', lane: 'sidewalk', start: -0.24, end: 1.24, speed: 0.082, phase: 0.44, variant: 'fox' })
  ]),
  interior: freeze({
    details: freeze(['wall-art', 'books', 'mug', 'pet-bed', 'pet-bowls']),
    pets: freeze(['wandering-dog', 'resting-cat'])
  })
});

export function validateLocationLifeConfig(config) {
  const errors = [];
  const requiredEnvironment = ['facade', 'sidewalk', 'road'];
  const requiredRoutes = ['pedestrian', 'pedestrian', 'car', 'car', 'animal'];

  if (JSON.stringify(config?.environment) !== JSON.stringify(requiredEnvironment)) errors.push('environment');
  if (!Array.isArray(config?.routes) || config.routes.length !== requiredRoutes.length) {
    errors.push('routes');
  } else {
    config.routes.forEach((route, index) => {
      if (route.kind !== requiredRoutes[index] || route.start >= 0 || route.end <= 1 ||
          !Number.isFinite(route.speed) || route.speed <= 0 || !Number.isFinite(route.phase)) {
        if (!errors.includes('routes')) errors.push('routes');
      }
    });
  }

  const details = config?.interior?.details;
  const pets = config?.interior?.pets;
  if (!Array.isArray(details) || !details.includes('pet-bed')) errors.push('interior.details');
  if (!Array.isArray(pets) || pets.length < 2) errors.push('interior.pets');

  return errors;
}

export default LOCATION_LIFE_CONFIG;
