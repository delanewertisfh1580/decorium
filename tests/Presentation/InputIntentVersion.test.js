import { expect, it } from 'vitest';
import { INPUT_INTENT_VERSION, INPUT_INTENTS } from '../../src/Presentation/Controllers/InputIntent.js';

it('publishes InputIntent v2 with touch-equivalent elevation and camera actions', () => {
  expect(INPUT_INTENT_VERSION).toBe(2);
  expect(INPUT_INTENTS).toMatchObject({
    RAISE: 'raise',
    LOWER: 'lower',
    RESET_CAMERA: 'reset-camera'
  });
});
