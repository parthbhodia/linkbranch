export type ThemeFont = "studio" | "editorial" | "rounded" | "mono";
export type ThemeButtonShape = "soft" | "pill" | "sharp";
export type ThemeBackground = "solid" | "grid" | "dots" | "bloom";
export type ThemeDensity = "relaxed" | "compact";

export type ProfileThemeConfig = {
  version: 1;
  colors: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    button: string;
    buttonText: string;
  };
  font: ThemeFont;
  buttonShape: ThemeButtonShape;
  background: ThemeBackground;
  density: ThemeDensity;
};

export type ThemePalette = {
  id: string;
  name: string;
  note: string;
  colors: ProfileThemeConfig["colors"];
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const fonts = new Set<ThemeFont>(["studio", "editorial", "rounded", "mono"]);
const shapes = new Set<ThemeButtonShape>(["soft", "pill", "sharp"]);
const backgrounds = new Set<ThemeBackground>(["solid", "grid", "dots", "bloom"]);
const densities = new Set<ThemeDensity>(["relaxed", "compact"]);

export const themePalettes: ThemePalette[] = [
  {
    id: "field-lime",
    name: "Field lime",
    note: "Bright, useful, editorial",
    colors: {
      background: "#f4f3ea",
      surface: "#fffef8",
      text: "#1c1d19",
      muted: "#696d63",
      accent: "#b74825",
      button: "#d9f36a",
      buttonText: "#1c1d19",
    },
  },
  {
    id: "midnight-signal",
    name: "Midnight signal",
    note: "High contrast, low glare",
    colors: {
      background: "#10120f",
      surface: "#1b1e18",
      text: "#f2f6eb",
      muted: "#b8c1af",
      accent: "#dfff70",
      button: "#dfff70",
      buttonText: "#10120f",
    },
  },
  {
    id: "cherry-paper",
    name: "Cherry paper",
    note: "Warm with a sharp accent",
    colors: {
      background: "#fff5f1",
      surface: "#fffdf9",
      text: "#2b1717",
      muted: "#765f5d",
      accent: "#d33b54",
      button: "#f5b8c4",
      buttonText: "#32151b",
    },
  },
  {
    id: "cobalt-studio",
    name: "Cobalt studio",
    note: "Clear, vivid, technical",
    colors: {
      background: "#eef2ff",
      surface: "#fbfcff",
      text: "#121c38",
      muted: "#63708e",
      accent: "#174fd6",
      button: "#174fd6",
      buttonText: "#ffffff",
    },
  },
  {
    id: "warm-clay",
    name: "Warm clay",
    note: "Grounded and tactile",
    colors: {
      background: "#f1e7dc",
      surface: "#fffaf3",
      text: "#30251e",
      muted: "#76695e",
      accent: "#c44720",
      button: "#30251e",
      buttonText: "#fffaf3",
    },
  },
];

const templateDefaults: Record<string, ProfileThemeConfig> = {
  "field-notes": {
    version: 1,
    colors: themePalettes[0].colors,
    font: "studio",
    buttonShape: "soft",
    background: "grid",
    density: "relaxed",
  },
  "after-dark": {
    version: 1,
    colors: themePalettes[1].colors,
    font: "studio",
    buttonShape: "soft",
    background: "bloom",
    density: "relaxed",
  },
  "soft-studio": {
    version: 1,
    colors: {
      background: "#f7eaf3",
      surface: "#fffaff",
      text: "#34232f",
      muted: "#765f70",
      accent: "#9b3c78",
      button: "#f0c5e1",
      buttonText: "#34232f",
    },
    font: "rounded",
    buttonShape: "pill",
    background: "bloom",
    density: "relaxed",
  },
};

function copyTheme(theme: ProfileThemeConfig): ProfileThemeConfig {
  return {
    ...theme,
    colors: { ...theme.colors },
  };
}

export function defaultProfileTheme(template: string): ProfileThemeConfig {
  return copyTheme(templateDefaults[template] ?? templateDefaults["field-notes"]);
}

export function parseProfileTheme(raw: unknown): ProfileThemeConfig | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const candidate = raw as Partial<ProfileThemeConfig>;
  const colors = candidate.colors;
  if (!colors || typeof colors !== "object" || Array.isArray(colors)) return null;

  const colorValues = colors as Record<string, unknown>;
  const colorKeys: Array<keyof ProfileThemeConfig["colors"]> = [
    "background",
    "surface",
    "text",
    "muted",
    "accent",
    "button",
    "buttonText",
  ];
  if (
    colorKeys.some(
      (key) =>
        typeof colorValues[key] !== "string" ||
        !HEX_COLOR.test(colorValues[key] as string),
    )
  ) {
    return null;
  }

  if (
    !fonts.has(candidate.font as ThemeFont) ||
    !shapes.has(candidate.buttonShape as ThemeButtonShape) ||
    !backgrounds.has(candidate.background as ThemeBackground) ||
    !densities.has(candidate.density as ThemeDensity)
  ) {
    return null;
  }

  return {
    version: 1,
    colors: Object.fromEntries(
      colorKeys.map((key) => [key, colorValues[key]]),
    ) as ProfileThemeConfig["colors"],
    font: candidate.font as ThemeFont,
    buttonShape: candidate.buttonShape as ThemeButtonShape,
    background: candidate.background as ThemeBackground,
    density: candidate.density as ThemeDensity,
  };
}

export function resolveProfileTheme(
  raw: unknown,
  template: string,
): ProfileThemeConfig {
  return parseProfileTheme(raw) ?? defaultProfileTheme(template);
}

const fontStacks: Record<ThemeFont, { display: string; body: string }> = {
  studio: {
    display: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
    body: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
  },
  editorial: {
    display: 'Georgia, "Times New Roman", serif',
    body: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
  },
  rounded: {
    display: '"Avenir Next Rounded", "Trebuchet MS", sans-serif',
    body: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
  },
  mono: {
    display: 'ui-monospace, "SFMono-Regular", Menlo, monospace',
    body: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
  },
};

export function profileThemeStyle(theme: ProfileThemeConfig) {
  const font = fontStacks[theme.font];
  return {
    "--profile-bg": theme.colors.background,
    "--profile-surface": theme.colors.surface,
    "--profile-text": theme.colors.text,
    "--profile-muted": theme.colors.muted,
    "--profile-accent": theme.colors.accent,
    "--profile-button": theme.colors.button,
    "--profile-button-text": theme.colors.buttonText,
    "--profile-display-font": font.display,
    "--profile-body-font": font.body,
  };
}

export function profileThemeClassName(theme: ProfileThemeConfig) {
  return [
    "profile-theme-custom",
    `profile-theme-font--${theme.font}`,
    `profile-theme-buttons--${theme.buttonShape}`,
    `profile-theme-background--${theme.background}`,
    `profile-theme-density--${theme.density}`,
  ].join(" ");
}
