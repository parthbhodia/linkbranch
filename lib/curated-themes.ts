import type { ProfileThemeConfig } from "./theme-config";

/**
 * Fixed looks, in the Linktree sense: a whole page direction in one card rather
 * than a palette to assemble yourself.
 *
 * The controls below the gallery stay exactly as they were -- a curated theme
 * is a starting point that writes its colours, texture, type, button shape and
 * spacing into the same draft, so anything can be nudged afterwards and the
 * card stops being selected.
 */
export type CuratedTheme = {
  id: string;
  name: string;
  note: string;
  colors: ProfileThemeConfig["colors"];
  background: ProfileThemeConfig["background"];
  font: ProfileThemeConfig["font"];
  buttonShape: ProfileThemeConfig["buttonShape"];
  density: ProfileThemeConfig["density"];
};

export const curatedThemes: CuratedTheme[] = [
  {
    id: "prism-pop",
    name: "Prism pop",
    note: "Lilac wash, lime buttons, poster caps",
    colors: {
      background: "#f6f1ff",
      surface: "#fffaff",
      text: "#1d1230",
      muted: "#6b5d84",
      accent: "#6d3cff",
      button: "#b9ff66",
      buttonText: "#16200c",
    },
    background: "prism",
    font: "poster",
    buttonShape: "pill",
    density: "relaxed",
  },
  {
    id: "midnight-signal",
    name: "Midnight",
    note: "Dark canvas, lime accent, quiet type",
    colors: {
      background: "#10120f",
      surface: "#1b1e18",
      text: "#f2f6eb",
      muted: "#b8c1af",
      accent: "#dfff70",
      button: "#dfff70",
      buttonText: "#10120f",
    },
    background: "aurora",
    font: "grotesk",
    buttonShape: "soft",
    density: "relaxed",
  },
  {
    id: "paper-ink",
    name: "Paper & ink",
    note: "Warm stock, sharp edges, editorial type",
    colors: {
      background: "#f1ece1",
      surface: "#fbf8f1",
      text: "#171610",
      muted: "#6b6659",
      accent: "#b74825",
      button: "#171610",
      buttonText: "#f7f3e8",
    },
    background: "paper",
    font: "editorial",
    buttonShape: "sharp",
    density: "relaxed",
  },
  {
    id: "cherry-soda",
    name: "Cherry soda",
    note: "Pink field, dotted texture, soft buttons",
    colors: {
      background: "#fff3f5",
      surface: "#fffdfd",
      text: "#2b1418",
      muted: "#7a5a60",
      accent: "#d33b54",
      button: "#f5b8c4",
      buttonText: "#32151b",
    },
    background: "dots",
    font: "rounded",
    buttonShape: "pill",
    density: "relaxed",
  },
  {
    id: "moss-studio",
    name: "Moss studio",
    note: "Quiet green, film grain, book type",
    colors: {
      background: "#edf2e7",
      surface: "#fbfcf8",
      text: "#1c2618",
      muted: "#66715f",
      accent: "#3f6b3a",
      button: "#cfe8b8",
      buttonText: "#1c2618",
    },
    background: "grain",
    font: "book",
    buttonShape: "soft",
    density: "relaxed",
  },
  {
    id: "cobalt-grid",
    name: "Cobalt grid",
    note: "Technical blue, notebook grid, hard corners",
    colors: {
      background: "#eef2ff",
      surface: "#fbfcff",
      text: "#121c38",
      muted: "#63708e",
      accent: "#174fd6",
      button: "#174fd6",
      buttonText: "#ffffff",
    },
    background: "grid",
    font: "grotesk",
    buttonShape: "sharp",
    density: "relaxed",
  },
  {
    id: "lilac-haze",
    name: "Lilac haze",
    note: "Layered wash, serif display, pill buttons",
    colors: {
      background: "#f3edff",
      surface: "#fbf8ff",
      text: "#241a3a",
      muted: "#6f5f8c",
      accent: "#8b5cf6",
      button: "#e6dbff",
      buttonText: "#241a3a",
    },
    background: "mesh",
    font: "didone",
    buttonShape: "pill",
    density: "relaxed",
  },
  {
    id: "sunset-flare",
    name: "Sunset",
    note: "Warm glow, sun-yellow buttons, poster caps",
    colors: {
      background: "#fff1e6",
      surface: "#fff9f2",
      text: "#2d1610",
      muted: "#7d5a4d",
      accent: "#d9491f",
      button: "#ffcf5c",
      buttonText: "#2d1610",
    },
    background: "flare",
    font: "poster",
    buttonShape: "pill",
    density: "relaxed",
  },
];

/** True when the draft already holds exactly this look. */
export function isCuratedThemeActive(
  theme: Pick<
    ProfileThemeConfig,
    "colors" | "background" | "font" | "buttonShape" | "density"
  >,
  candidate: CuratedTheme,
) {
  return (
    theme.background === candidate.background &&
    theme.font === candidate.font &&
    theme.buttonShape === candidate.buttonShape &&
    theme.density === candidate.density &&
    theme.colors.background === candidate.colors.background &&
    theme.colors.surface === candidate.colors.surface &&
    theme.colors.text === candidate.colors.text &&
    theme.colors.muted === candidate.colors.muted &&
    theme.colors.accent === candidate.colors.accent &&
    theme.colors.button === candidate.colors.button &&
    theme.colors.buttonText === candidate.colors.buttonText
  );
}
