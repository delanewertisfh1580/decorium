const freeze = value => Object.freeze(value);

export const DESIGN_TOKENS = freeze({
  reference: freeze({ width: 1280, height: 720 }),
  spacing: freeze({
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48
  }),
  radius: freeze({
    small: 8,
    medium: 12,
    large: 16,
    panel: 18
  }),
  typography: freeze({
    body: 20,
    secondary: 16,
    heading: 32,
    button: 20
  }),
  touchTarget: freeze({
    minimum: 44,
    comfortable: 64
  }),
  colors: freeze({
    background: '#f3eee7',
    panel: '#fffaf3',
    text: '#384442',
    muted: '#74827d',
    accent: '#6f8f87',
    accentStrong: '#52756e',
    warm: '#c99654',
    danger: '#c56f68'
  }),
  motion: freeze({
    micro: 100,
    press: 100,
    panel: 200,
    result: 420,
    invalid: 220
  })
});

const REQUIRED_SPACING = [4, 8, 12, 16, 24, 32, 48];

const isHexColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

export function validateDesignTokens(tokens) {
  const errors = [];
  const reference = tokens?.reference;
  const spacing = tokens?.spacing;
  const radius = tokens?.radius;
  const typography = tokens?.typography;
  const touchTarget = tokens?.touchTarget;
  const colors = tokens?.colors;
  const motion = tokens?.motion;

  if (reference?.width !== 1280) errors.push('reference.width');
  if (reference?.height !== 720) errors.push('reference.height');
  if (JSON.stringify(Object.values(spacing ?? {})) !== JSON.stringify(REQUIRED_SPACING)) {
    errors.push('spacing');
  }
  if (!radius || radius.small !== 8 || radius.medium !== 12 || radius.large !== 16) errors.push('radius');
  if (!typography || typography.body < 20) errors.push('typography.body');
  if (!typography || typography.secondary < 16) errors.push('typography.secondary');
  if (!typography || typography.button < 20) errors.push('typography.button');
  if (!touchTarget || touchTarget.minimum < 44) errors.push('touchTarget.minimum');
  if (!colors || !Object.values(colors).every(isHexColor)) errors.push('colors');
  if (!motion || motion.micro < 80 || motion.micro > 120 || motion.panel <= motion.micro) {
    errors.push('motion');
  }

  return errors;
}

export function applyDesignTokens(root, tokens = DESIGN_TOKENS) {
  if (!root?.style) return;

  const cssValues = {
    '--reference-width': `${tokens.reference.width}px`,
    '--reference-height': `${tokens.reference.height}px`,
    '--space-xs': `${tokens.spacing.xs}px`,
    '--space-sm': `${tokens.spacing.sm}px`,
    '--space-md': `${tokens.spacing.md}px`,
    '--space-lg': `${tokens.spacing.lg}px`,
    '--space-xl': `${tokens.spacing.xl}px`,
    '--space-xxl': `${tokens.spacing.xxl}px`,
    '--space-xxxl': `${tokens.spacing.xxxl}px`,
    '--radius-small': `${tokens.radius.small}px`,
    '--radius-medium': `${tokens.radius.medium}px`,
    '--radius-large': `${tokens.radius.large}px`,
    '--radius-panel': `${tokens.radius.panel}px`,
    '--font-body': `${tokens.typography.body}px`,
    '--font-secondary': `${tokens.typography.secondary}px`,
    '--font-heading': `${tokens.typography.heading}px`,
    '--font-button': `${tokens.typography.button}px`,
    '--touch-min': `${tokens.touchTarget.minimum}px`,
    '--touch-comfort': `${tokens.touchTarget.comfortable}px`,
    '--motion-micro': `${tokens.motion.micro}ms`,
    '--motion-press': `${tokens.motion.press}ms`,
    '--motion-panel': `${tokens.motion.panel}ms`,
    '--color-background': tokens.colors.background,
    '--color-panel': tokens.colors.panel,
    '--color-text': tokens.colors.text,
    '--color-muted': tokens.colors.muted,
    '--color-accent': tokens.colors.accent,
    '--color-accent-strong': tokens.colors.accentStrong,
    '--color-warm': tokens.colors.warm,
    '--color-danger': tokens.colors.danger
  };

  for (const [name, value] of Object.entries(cssValues)) root.style.setProperty(name, value);
}

export default DESIGN_TOKENS;
