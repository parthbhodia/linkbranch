/**
 * Who can install this app, how, and for how long a dismissal lasts.
 *
 * Split out from the panel because the answers are browser-specific and easy
 * to get quietly wrong: only Safari can install on iOS, only Chromium fires
 * `beforeinstallprompt`, and desktop Firefox and Safari cannot install at all.
 * A panel that shows a button those browsers cannot honour is worse than one
 * that tells them where their own control is.
 */

/**
 * How long "not now" lasts.
 *
 * It used to last forever: the panel wrote a flag with no timestamp and no
 * expiry, and nothing anywhere could clear it. Anyone who closed the card
 * once -- including while it was being built -- never saw it again on that
 * browser and had no way to ask for it back.
 */
export const DISMISS_DAYS = 30;

const DAY_MS = 86_400_000;

/** Whether a stored dismissal still applies. */
export function isDismissed(raw: string | null, now: number = Date.now()): boolean {
  if (!raw) return false;
  // The original format. Treated as "dismissed just now" rather than as
  // forever, so existing dismissals expire instead of being permanent, and
  // rather than as expired, which would re-nag everyone at once.
  if (raw === "1") return true;
  const at = Number(raw);
  if (!Number.isFinite(at)) return false;
  return now - at < DISMISS_DAYS * DAY_MS;
}

/** Legacy "1" carries no date, so give it one the first time it is read. */
export function normalizeDismissal(
  raw: string | null,
  now: number = Date.now(),
): string | null {
  return raw === "1" ? String(now) : raw;
}

export function serializeDismissal(now: number = Date.now()): string {
  return String(now);
}

export type InstallGuidance =
  /** Chromium fired its event: we can open the real install dialog. */
  | { kind: "prompt" }
  /** Safari on iOS: the Share sheet, spelled out. */
  | { kind: "ios-safari" }
  /** Chrome, Firefox, Edge on iOS: WebKit wrappers with no install item. */
  | { kind: "ios-other" }
  /** Chromium on Android without the event yet: its own menu item. */
  | { kind: "android-menu" }
  /** Chrome, Edge, Brave, Opera on a computer: the address-bar control. */
  | { kind: "desktop-chromium" }
  /** Desktop Safari: Dock, via the File menu. */
  | { kind: "desktop-safari" }
  /** Desktop Firefox and anything else: no install support at all. */
  | { kind: "unsupported" };

export type BrowserFacts = {
  userAgent: string;
  maxTouchPoints: number;
  hasPrompt: boolean;
};

export function isIos({ userAgent, maxTouchPoints }: Pick<BrowserFacts, "userAgent" | "maxTouchPoints">) {
  // iPadOS 13+ reports "Macintosh"; no Mac reports more than one touch point.
  const iPadOs = /macintosh/i.test(userAgent) && maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(userAgent) || iPadOs;
}

export function isAndroid(userAgent: string) {
  return /android/i.test(userAgent);
}

/** Chrome, Edge, Brave, Opera, Arc. Excludes the iOS wrappers. */
function isDesktopChromium(userAgent: string) {
  return /chrome|chromium|crios|edg\//i.test(userAgent) && !/edgios|fxios|opios/i.test(userAgent);
}

/**
 * What to offer this browser. Never returns "show nothing": every branch has
 * something true to say, which is the point -- the panel used to render
 * nothing at all on a computer, so the app looked uninstallable there.
 */
export function installGuidance(facts: BrowserFacts): InstallGuidance {
  if (facts.hasPrompt) return { kind: "prompt" };

  if (isIos(facts)) {
    const wrapper = /crios|fxios|edgios|opios/i.test(facts.userAgent);
    return wrapper ? { kind: "ios-other" } : { kind: "ios-safari" };
  }

  if (isAndroid(facts.userAgent)) return { kind: "android-menu" };

  if (isDesktopChromium(facts.userAgent)) return { kind: "desktop-chromium" };

  // Desktop Safari added "Add to Dock" in Sonoma; older ones do nothing, but
  // pointing at the File menu is still the closest true answer.
  if (/safari/i.test(facts.userAgent) && !/chrome|chromium/i.test(facts.userAgent)) {
    return { kind: "desktop-safari" };
  }

  return { kind: "unsupported" };
}

export const GUIDANCE_COPY: Record<InstallGuidance["kind"], string> = {
  prompt: "",
  "ios-safari": "Tap Share in Safari's toolbar, then Add to Home Screen.",
  "ios-other":
    "Only Safari can add an app to the iPhone home screen. Open this page in Safari and the option appears under Share.",
  "android-menu":
    "Open your browser's menu and choose Install app, or Add to home screen.",
  "desktop-chromium":
    "Click the install icon at the right-hand end of the address bar, or open the browser menu and choose Cast, save and share, then Install page as app.",
  "desktop-safari": "In Safari, open the File menu and choose Add to Dock.",
  unsupported:
    "This browser cannot install web apps. Chrome, Edge or Safari can, on the same address.",
};
