export const colors = {
  cream: "#FAFAFA",
  cream2: "#F4F4F5",
  bone: "#FFFFFF",
  ink: "#09090B",
  ink2: "#27272A",
  muted: "#71717A",
  muted2: "#A1A1AA",
  coral: "#D94A29",
  coralDeep: "#B83A1F",
  sage: "#8B9776",
  rose: "#E6BBAE",
  clay: "#C99877",
  sky: "#A8B5C2",
  rule: "#E4E4E7",
  ruleSoft: "#F4F4F5",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 64,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
};

export const font = {
  body: undefined as string | undefined,
  serif: undefined as string | undefined,
  mono: undefined as string | undefined,
};

export const type = {
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    textTransform: "uppercase" as const,
    fontWeight: "500" as const,
  },
  h1: {
    fontSize: 32,
    lineHeight: 38,
    color: colors.ink,
    fontWeight: "500" as const,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink,
    fontWeight: "500" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
    fontWeight: "500" as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink2,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  tiny: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted2,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    color: colors.muted,
    textTransform: "uppercase" as const,
    fontWeight: "500" as const,
  },
};
