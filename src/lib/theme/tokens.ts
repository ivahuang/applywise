// Sage & Stone palette — ApplyWise design tokens
// Used across all components for consistent styling

export const theme = {
  // Core surfaces
  bg: "#F8F9F6",
  card: "#FFFFFF",
  muted: "#EFF1EC",

  // Text hierarchy
  text: "#262E26",
  textSecondary: "#6E7C6E",
  textMuted: "#A3AEA3",

  // Borders
  border: "#DDE3DB",
  borderHover: "#C4CEC2",

  // Accent
  accent: "#4A7258",
  accentBg: "#EDF5F0",
  accentLight: "#7BAD8A",

  // Tier colors
  reach: { fg: "#B44D2E", bg: "#FFF2ED", bar: "#D4673F" },
  target: { fg: "#3D6B8E", bg: "#EDF4F9", bar: "#5892BD" },
  safe: { fg: "#3D7250", bg: "#EDF6F0", bar: "#4A7258" },

  // Status colors
  warning: "#B08D35",
  warningBg: "#FDF8E8",
  danger: "#B44D2E",
  dangerBg: "#FFF2ED",
  success: "#3D7250",
  successBg: "#EDF6F0",
  info: "#3D6B8E",
  infoBg: "#EDF4F9",
  purple: "#6B4FA0",
  purpleBg: "#F3EFFA",

  // Button
  buttonBg: "#262E26",
  buttonFg: "#F8F9F6",

  // Stage phase colors
  phases: {
    pre: "#5892BD",
    wait: "#B08D35",
    post: "#1D9E75",
    visa: "#D4537E",
  },

  // Category colors for checklist sections
  categories: {
    scores: "#5892BD",
    essays: "#D4673F",
    recs: "#8B6BB5",
    fees: "#4A7258",
    postOffer: "#1D9E75",
    visa: "#D4537E",
  },
} as const;

export type Tier = "reach" | "target" | "safe";
export type Phase = "pre" | "wait" | "post" | "visa";

export const tierConfig: Record<Tier, { en: string; zh: string; fg: string; bg: string; bar: string }> = {
  reach: { en: "Reach", zh: "冲刺", ...theme.reach },
  target: { en: "Target", zh: "目标", ...theme.target },
  safe: { en: "Safe", zh: "稳妥", ...theme.safe },
};
