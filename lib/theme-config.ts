export type ThemeFont =
  | "studio"
  | "editorial"
  | "rounded"
  | "mono"
  | "grotesk"
  | "book"
  | "typewriter"
  | "humanist"
  | "slab"
  | "didone"
  | "poster";
export type ThemeButtonShape = "soft" | "pill" | "sharp" | "glass" | "outline";
export type ThemeBackground =
  | "solid"
  | "grid"
  | "dots"
  | "bloom"
  | "mesh"
  | "stripes"
  | "paper"
  | "aurora"
  | "grain"
  | "prism"
  | "graph"
  | "flare"
  | "ink"
  | "lagoon"
  | "lilac";
export type ThemeDensity = "relaxed" | "compact";
export type ThemeFontScale = "sm" | "md" | "lg" | "xl";
export type ThemeFontWeight = "regular" | "medium" | "bold";
export type ThemeFontStyle = "normal" | "italic";
/** Silhouette of the avatar on the public page. */
export type ThemeAvatarShape = "circle" | "rounded" | "square";
/** Size step for the row of social icons. */
export type ThemeSocialSize = "sm" | "md" | "lg" | "xl";

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
  /** Size step for the profile's own text; a multiplier over the base sizes. */
  fontScale?: ThemeFontScale;
  /** Weight applied to the display text (name and headline). */
  fontWeight?: ThemeFontWeight;
  /** Slant applied to the display text. */
  fontStyle?: ThemeFontStyle;
  buttonShape: ThemeButtonShape;
  background: ThemeBackground;
  density: ThemeDensity;
  /** Show the public contact/subscribe form on the profile. */
  contactForm?: boolean;
  /**
   * Show the search box above the links. Off unless set, and only drawn on a
   * page with more than five links even then. It used to be absent-means-shown,
   * which put a search field above every five-link page in the product.
   */
  search?: boolean;
  /** Silhouette of the avatar. Absent means the circle every page started with. */
  avatarShape?: ThemeAvatarShape;
  /** A solid ring around the avatar, as a frame against a busy backdrop. */
  avatarRing?: boolean;
  /** Blow the avatar up, blurred and faded, behind the name and headline. */
  avatarBackdrop?: boolean;
  /**
   * Size step for the row of social icons. Absent means the size the page
   * already had, so a template that sizes its own row keeps it.
   */
  socialSize?: ThemeSocialSize;
  /** Optional custom brand mark shown above the profile intro. */
  logoPath?: string | null;
  /** Optional full-bleed wallpaper image layered under the page. */
  wallpaperPath?: string | null;
};

export type ThemePalette = {
  id: string;
  name: string;
  note: string;
  colors: ProfileThemeConfig["colors"];
};

export const themeBackgroundOptions: Array<{
  id: ThemeBackground;
  name: string;
  note: string;
}> = [
  { id: "solid", name: "Solid", note: "Clean flat color" },
  { id: "ink", name: "Ink", note: "Bold charcoal block" },
  { id: "lagoon", name: "Lagoon", note: "Bold teal block" },
  { id: "lilac", name: "Lilac", note: "Bold lavender block" },
  { id: "prism", name: "Prism", note: "Oil-slick color wash" },
  { id: "graph", name: "Graph", note: "Fine notebook grid" },
  { id: "flare", name: "Flare", note: "Soft radial glow" },
  { id: "grid", name: "Grid", note: "Editorial notebook" },
  { id: "dots", name: "Dots", note: "Soft dotted field" },
  { id: "bloom", name: "Bloom", note: "Soft top glow" },
  { id: "mesh", name: "Mesh", note: "Layered color wash" },
  { id: "stripes", name: "Stripes", note: "Diagonal rhythm" },
  { id: "paper", name: "Paper", note: "Subtle fiber grain" },
  { id: "aurora", name: "Aurora", note: "Twin light washes" },
  { id: "grain", name: "Grain", note: "Film texture" },
];

/** The type pairings a creator can pick from. Order is the order they appear in
 *  the picker: the four the product shipped with first, then the wider set the
 *  carousel made room for. */
export const themeFontOptions: Array<{
  id: ThemeFont;
  name: string;
  sample: string;
}> = [
  { id: "studio", name: "Studio", sample: "Useful things" },
  { id: "editorial", name: "Editorial", sample: "Useful things" },
  { id: "rounded", name: "Rounded", sample: "Useful things" },
  { id: "mono", name: "Mono", sample: "USEFUL THINGS" },
  { id: "grotesk", name: "Grotesk", sample: "Useful things" },
  { id: "book", name: "Book", sample: "Useful things" },
  { id: "typewriter", name: "Typewriter", sample: "useful_things" },
  { id: "humanist", name: "Humanist", sample: "Useful things" },
  { id: "slab", name: "Slab", sample: "Useful things" },
  { id: "didone", name: "Didone", sample: "Useful things" },
  // A poster face: one heavy condensed cut, no light weights to fall back on.
  // The sample is uppercased by the card's own rule, the way the face is used.
  { id: "poster", name: "Poster", sample: "Big energy" },
];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const fonts = new Set<ThemeFont>([
  "studio",
  "editorial",
  "rounded",
  "mono",
  "grotesk",
  "book",
  "typewriter",
  "humanist",
  "slab",
  "didone",
  "poster",
]);
const shapes = new Set<ThemeButtonShape>([
  "soft",
  "pill",
  "sharp",
  "glass",
  "outline",
]);
const backgrounds = new Set<ThemeBackground>(
  themeBackgroundOptions.map((item) => item.id),
);
const densities = new Set<ThemeDensity>(["relaxed", "compact"]);
const fontScales = new Set<ThemeFontScale>(["sm", "md", "lg", "xl"]);
const fontWeights = new Set<ThemeFontWeight>(["regular", "medium", "bold"]);
const fontStyles = new Set<ThemeFontStyle>(["normal", "italic"]);
const avatarShapes = new Set<ThemeAvatarShape>(["circle", "rounded", "square"]);
const socialSizes = new Set<ThemeSocialSize>(["sm", "md", "lg", "xl"]);

export const themeFontScaleOptions: Array<{
  id: ThemeFontScale;
  name: string;
  note: string;
}> = [
  { id: "sm", name: "Small", note: "Tighter type" },
  { id: "md", name: "Default", note: "Balanced" },
  { id: "lg", name: "Large", note: "Easier to read" },
  { id: "xl", name: "Extra large", note: "Loud and clear" },
];

export const themeFontWeightOptions: Array<{
  id: ThemeFontWeight;
  name: string;
}> = [
  { id: "regular", name: "Regular" },
  { id: "medium", name: "Medium" },
  { id: "bold", name: "Bold" },
];

export const themeFontStyleOptions: Array<{
  id: ThemeFontStyle;
  name: string;
}> = [
  { id: "normal", name: "Upright" },
  { id: "italic", name: "Italic" },
];

export const themeAvatarShapeOptions: Array<{
  id: ThemeAvatarShape;
  name: string;
  note: string;
}> = [
  { id: "circle", name: "Circle", note: "The default round photo" },
  { id: "rounded", name: "Rounded", note: "A squircle, like an app icon" },
  { id: "square", name: "Square", note: "A hard-edged tile" },
];

export const themeSocialSizeOptions: Array<{
  id: ThemeSocialSize;
  name: string;
  note: string;
}> = [
  { id: "sm", name: "Small", note: "Tucked in" },
  { id: "md", name: "Default", note: "The size the row ships at" },
  { id: "lg", name: "Large", note: "Easier to hit" },
  { id: "xl", name: "Extra large", note: "The loudest the row gets" },
];

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
  {
    id: "moss-garden",
    name: "Moss garden",
    note: "Quiet green, soft light",
    colors: {
      background: "#eef3ea",
      surface: "#fbfcf8",
      text: "#1c2618",
      muted: "#66715f",
      accent: "#3f6b3a",
      button: "#cfe8b8",
      buttonText: "#1c2618",
    },
  },
  {
    id: "ink-violet",
    name: "Ink violet",
    note: "Night studio energy",
    colors: {
      background: "#16121f",
      surface: "#221b2e",
      text: "#f4eefc",
      muted: "#b7a8c9",
      accent: "#c9a0ff",
      button: "#c9a0ff",
      buttonText: "#16121f",
    },
  },
  {
    id: "charcoal-block",
    name: "Charcoal block",
    note: "Bold dark stage",
    colors: {
      background: "#1c2330",
      surface: "#2a3344",
      text: "#f4f6f8",
      muted: "#a7b0bd",
      accent: "#d9f36a",
      button: "#d9f36a",
      buttonText: "#1c2330",
    },
  },
  {
    id: "teal-block",
    name: "Teal block",
    note: "Bright commerce energy",
    colors: {
      background: "#00a8a8",
      surface: "#ffffff",
      text: "#102628",
      muted: "#2f5557",
      accent: "#102628",
      button: "#102628",
      buttonText: "#ffffff",
    },
  },
  {
    id: "lavender-block",
    name: "Lavender block",
    note: "Soft analytics pastel",
    colors: {
      background: "#efc8ef",
      surface: "#fff8ff",
      text: "#2a1830",
      muted: "#6f5674",
      accent: "#6b3d9b",
      button: "#2a1830",
      buttonText: "#fff8ff",
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
    contactForm: true,
  },
  "signal-deck": {
    version: 1,
    colors: {
      background: "#0f141c",
      surface: "#1a2230",
      text: "#f3f6fb",
      muted: "#9aa7b8",
      accent: "#b9ff66",
      button: "#243044",
      buttonText: "#b9ff66",
    },
    font: "mono",
    buttonShape: "soft",
    background: "ink",
    density: "compact",
    contactForm: false,
  },
  // The four below deliberately differ on more than palette. Each one takes a
  // different font, button shape and background treatment, because four
  // templates that shared a layout and varied only in colour were reading as
  // the same template painted over.
  "press-sheet": {
    version: 1,
    colors: {
      background: "#f1efe6",
      surface: "#ffffff",
      text: "#0d0d0b",
      muted: "#4c4c46",
      accent: "#d5361f",
      button: "#0d0d0b",
      buttonText: "#ffffff",
    },
    font: "mono",
    buttonShape: "sharp",
    background: "graph",
    density: "compact",
    contactForm: false,
  },
  "golden-hour": {
    version: 1,
    colors: {
      background: "#fff0e4",
      surface: "#fff8f3",
      text: "#3a1d12",
      muted: "#8a5741",
      accent: "#e2582a",
      button: "#ff8a4c",
      buttonText: "#3a1008",
    },
    font: "rounded",
    buttonShape: "pill",
    background: "flare",
    density: "relaxed",
    contactForm: true,
  },
  broadsheet: {
    version: 1,
    colors: {
      background: "#f5f3ea",
      surface: "#fffdf6",
      text: "#1b201a",
      muted: "#5b6254",
      accent: "#2f5d3f",
      button: "#1b201a",
      buttonText: "#f5f3ea",
    },
    font: "editorial",
    buttonShape: "outline",
    background: "paper",
    density: "relaxed",
    contactForm: true,
  },
  "tide-pool": {
    version: 1,
    colors: {
      background: "#08202c",
      surface: "#0f3242",
      text: "#e9f6f8",
      muted: "#9ac2cd",
      accent: "#4fd3c4",
      button: "#16495e",
      buttonText: "#4fd3c4",
    },
    font: "studio",
    buttonShape: "glass",
    background: "lagoon",
    density: "relaxed",
    contactForm: false,
  },
};

function copyTheme(theme: ProfileThemeConfig): ProfileThemeConfig {
  return {
    ...theme,
    colors: { ...theme.colors },
    fontScale: theme.fontScale ?? "md",
    fontWeight: theme.fontWeight ?? "regular",
    fontStyle: theme.fontStyle ?? "normal",
    contactForm: theme.contactForm ?? false,
    // Off unless a creator turns it on: a short page does not need a search
    // box above the five links it is searching.
    search: theme.search ?? false,
    avatarRing: theme.avatarRing ?? false,
    avatarBackdrop: theme.avatarBackdrop ?? false,
    logoPath: theme.logoPath ?? null,
    wallpaperPath: theme.wallpaperPath ?? null,
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
    // Added after the first themes shipped, so a stored theme without them is
    // valid and simply takes the default rather than falling back wholesale.
    fontScale: fontScales.has(candidate.fontScale as ThemeFontScale)
      ? (candidate.fontScale as ThemeFontScale)
      : "md",
    fontWeight: fontWeights.has(candidate.fontWeight as ThemeFontWeight)
      ? (candidate.fontWeight as ThemeFontWeight)
      : "regular",
    fontStyle: fontStyles.has(candidate.fontStyle as ThemeFontStyle)
      ? (candidate.fontStyle as ThemeFontStyle)
      : "normal",
    contactForm: candidate.contactForm === true,
    // Off unless explicitly on. The box used to be shown by default because it
    // was drawn unconditionally; that made every five-link page sit under a
    // search field it had no use for.
    search: candidate.search === true,
    // Left off entirely unless the creator picks one. A template is allowed to
    // give its own avatar a shape -- soft-studio rounds and tilts it -- and a
    // default of "circle" here would quietly straighten every one of them.
    ...(avatarShapes.has(candidate.avatarShape as ThemeAvatarShape)
      ? { avatarShape: candidate.avatarShape as ThemeAvatarShape }
      : {}),
    avatarRing: candidate.avatarRing === true,
    avatarBackdrop: candidate.avatarBackdrop === true,
    // Left off unless picked, for the same reason as the shape above: a
    // template is allowed to size its own row.
    ...(socialSizes.has(candidate.socialSize as ThemeSocialSize)
      ? { socialSize: candidate.socialSize as ThemeSocialSize }
      : {}),
    logoPath:
      typeof (candidate as { logoPath?: unknown }).logoPath === "string"
        ? ((candidate as { logoPath: string }).logoPath.slice(0, 512) || null)
        : null,
    wallpaperPath:
      typeof (candidate as { wallpaperPath?: unknown }).wallpaperPath === "string"
        ? ((candidate as { wallpaperPath: string }).wallpaperPath.slice(0, 512) ||
          null)
        : null,
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
  grotesk: {
    display: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    body: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  // Serif on both sides: a reading page rather than a headline over sans copy.
  book: {
    display: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
    body: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
  },
  // One monospaced voice throughout, which is a different idea from "mono",
  // where the title is typed and the body is normal.
  typewriter: {
    display: 'ui-monospace, "SFMono-Regular", Menlo, "Courier New", monospace',
    body: 'ui-monospace, "SFMono-Regular", Menlo, "Courier New", monospace',
  },
  humanist: {
    display: 'Optima, Candara, "Gill Sans", "Segoe UI", sans-serif',
    body: 'Candara, "Avenir Next", "Segoe UI", sans-serif',
  },
  slab: {
    display: 'Rockwell, "Roboto Slab", "Courier New", Georgia, serif',
    body: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
  },
  didone: {
    display: 'Didot, "Bodoni MT", "Playfair Display", Georgia, serif',
    body: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
  },
  // Self-hosted by next/font (see app/layout.tsx); the fallbacks are the heavy
  // condensed faces machines already have, so the first paint is not a
  // sentence-case sans that reflows into a different shape.
  poster: {
    display: 'var(--font-poster), Impact, Haettenschweiler, "Arial Narrow", sans-serif',
    body: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
  },
};

/** WCAG relative luminance. Colors are validated as #rrggbb before they land
 *  in a theme, so parsing can assume that shape. */
function luminance(hex: string) {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function blend(from: string, to: string, amount: number) {
  const channel = (offset: number) => {
    const start = parseInt(from.slice(offset, offset + 2), 16);
    const end = parseInt(to.slice(offset, offset + 2), 16);
    return Math.round(start + (end - start) * amount)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

/**
 * Secondary text colour that stays legible on the creator's own page.
 *
 * The theme editor accepts any muted colour, and a pale one is a perfectly
 * good choice against a dark background — but the same value on a light
 * surface disappears. A pale lime on cream measures about 1.6:1, which is how
 * section headings and the supporter badge became invisible in practice.
 *
 * A fixed blend in CSS cannot fix this: it would have to be strong enough for
 * the worst theme, which would flatten every well-chosen one. So walk the
 * creator's muted colour toward their text colour only as far as AA requires,
 * and leave a theme that already passes exactly as authored. Measured against
 * whichever of surface/background is worse, because muted text appears on
 * both.
 */
/**
 * Ink or paper, whichever reads better on `background`. Perk cards take their
 * colour from the creator, so a fixed white foreground was only ever a bet on
 * them picking something dark -- on a mustard or lime card it lands around 2:1
 * and the offer becomes hard to read.
 */
export function readableForeground(background: string) {
  const ink = "#17180f";
  const paper = "#fffef8";
  return contrast(ink, background) >= contrast(paper, background) ? ink : paper;
}

export function readableMuted(colors: ProfileThemeConfig["colors"]) {
  const { muted, surface, background, text } = colors;
  const worst = (candidate: string) =>
    Math.min(contrast(candidate, surface), contrast(candidate, background));

  if (worst(muted) >= 4.5) return muted;

  for (let amount = 0.05; amount < 1; amount += 0.05) {
    const candidate = blend(muted, text, amount);
    if (worst(candidate) >= 4.5) return candidate;
  }

  // Even the text colour can fail this when the creator picks a surface close
  // to their text. Returning it anyway is the most legible value available,
  // and matches what the rest of the page already uses.
  return text;
}

export function profileThemeStyle(
  theme: ProfileThemeConfig,
  options?: { wallpaperUrl?: string | null },
) {
  // A theme written by a newer build can name a pairing this one does not have
  // yet, which happens during a deploy. Falling back beats rendering nothing.
  const font = fontStacks[theme.font] ?? fontStacks.studio;
  const scale = { sm: 0.92, md: 1, lg: 1.08, xl: 1.18 }[theme.fontScale ?? "md"];
  const weight = { regular: 400, medium: 500, bold: 700 }[
    theme.fontWeight ?? "regular"
  ];
  return {
    "--profile-bg": theme.colors.background,
    "--profile-surface": theme.colors.surface,
    "--profile-text": theme.colors.text,
    // Authored value stays for borders and decoration, which are drawn at low
    // alpha and were never the legibility problem.
    "--profile-muted": theme.colors.muted,
    "--profile-muted-readable": readableMuted(theme.colors),
    "--profile-accent": theme.colors.accent,
    "--profile-button": theme.colors.button,
    "--profile-button-text": theme.colors.buttonText,
    "--profile-display-font": font.display,
    "--profile-body-font": font.body,
    // Creator typography controls; the CSS multiplies its base sizes by these.
    "--profile-font-scale": String(scale),
    "--profile-font-weight": String(weight),
    "--profile-font-style": theme.fontStyle ?? "normal",
    ...(options?.wallpaperUrl
      ? { "--profile-wallpaper": `url("${options.wallpaperUrl}")` }
      : {}),
  };
}

export function profileThemeClassName(
  theme: ProfileThemeConfig,
  options?: { wallpaperUrl?: string | null },
) {
  return [
    "profile-theme-custom",
    `profile-theme-font--${theme.font}`,
    `profile-theme-buttons--${theme.buttonShape}`,
    `profile-theme-background--${theme.background}`,
    `profile-theme-density--${theme.density}`,
    options?.wallpaperUrl ? "profile-theme-has-wallpaper" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
