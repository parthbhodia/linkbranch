"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import CloseRounded from "@mui/icons-material/CloseRounded";
import IosShareRounded from "@mui/icons-material/IosShareRounded";
import InstallMobileRounded from "@mui/icons-material/InstallMobileRounded";
import { Button, IconButton, Typography } from "@mui/material";
import {
  GUIDANCE_COPY,
  installGuidance,
  isAndroid,
  isDismissed,
  isIos,
  normalizeDismissal,
  serializeDismissal,
  type InstallGuidance,
} from "@/lib/install-hints";

// Chrome fires this so a site can offer its own install affordance. It is not
// in lib.dom, hence the local shape.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "cueful:install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS predates the display-mode media query for installed web apps.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

type InstallAppProps = {
  /**
   * "inline" sits in the document flow -- the card screen puts it above the
   * code. "floating" pins it to a corner, for the dashboard, whose shell is a
   * fixed-height grid with overflow hidden: an in-flow panel there would push
   * the whole workspace off screen rather than sit above it.
   */
  placement?: "inline" | "floating";
  /**
   * Something else already owns the bottom of the screen, so move to the top
   * rather than overlap it. Used for the share prompt, which is bottom-anchored
   * and, on a phone, wide enough to collide.
   */
  avoidBottom?: boolean;
  /**
   * Show even when the visitor dismissed the suggestion, and on a computer.
   * For the deliberate "Install the app" control in settings: someone who went
   * looking for it is not being nagged, and an earlier "not now" should not be
   * able to hide the only way to say yes.
   */
  requested?: boolean;
};

/**
 * Offers installation. The worker itself is registered app-wide by
 * ServiceWorkerRegistrar.
 *
 * Renders nothing when the app is already installed, or when the visitor
 * dismissed the suggestion recently -- so it is safe to mount anywhere. With
 * `requested`, it always renders: that is the settings control, where someone
 * came looking for it.
 */
export function InstallApp({
  placement = "inline",
  avoidBottom = false,
  requested = false,
}: InstallAppProps) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  // Nothing about installability can be known while rendering on the server,
  // and reading it during hydration would mismatch. This is the standard way
  // to say "client only" without setting state from an effect.
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const onPrompt = (event: Event) => {
      // Chrome shows its own mini-infobar unless this is cancelled, and the
      // event cannot be re-triggered later once that has happened.
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // A dismissal used to be a bare "1" that nothing could clear, so closing
  // this once hid it on that browser forever. It now carries a date and ages
  // out; the legacy flag is stamped on first read so it ages out too.
  useEffect(() => {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    const stamped = normalizeDismissal(raw);
    if (stamped !== raw && stamped !== null) {
      window.localStorage.setItem(DISMISSED_KEY, stamped);
    }
  }, []);

  const alreadyDismissed =
    isClient && isDismissed(window.localStorage.getItem(DISMISSED_KEY));

  const facts = {
    userAgent: isClient ? window.navigator.userAgent : "",
    maxTouchPoints: isClient ? window.navigator.maxTouchPoints : 0,
    hasPrompt: Boolean(promptEvent),
  };
  const guidance: InstallGuidance = isClient
    ? installGuidance(facts)
    : { kind: "unsupported" };
  const mobile = isClient && (isIos(facts) || isAndroid(facts.userAgent));

  const visible =
    isClient &&
    !installed &&
    !isStandalone() &&
    // Asked for deliberately: an earlier "not now" must not be able to hide
    // the only way to say yes.
    (requested ||
      (!dismissed &&
        !alreadyDismissed &&
        // The dashboard offer exists so the phone that gets carried to an event
        // can open the code without the browser. A desktop PWA does nothing for
        // that, so the floating placement stays off computers.
        (placement === "inline" || mobile)));

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, serializeDismissal());
    setDismissed(true);
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    // Single-use either way, so drop it and stop offering.
    setPromptEvent(null);
    if (outcome === "accepted") setInstalled(true);
  }

  if (!visible) return null;

  return (
    <aside
      className={`install-app${
        placement === "floating" ? " install-app--floating" : ""
      }${placement === "floating" && avoidBottom ? " install-app--top" : ""}`}
    >
      <div className="install-app__icon" aria-hidden="true">
        <InstallMobileRounded />
      </div>
      <div className="install-app__copy">
        <Typography component="h3">Keep your code in your pocket</Typography>
        <Typography variant="body2">
          Add Cueful to your home screen and your QR opens in one tap — no
          browser, no typing the address at an event.
        </Typography>

        {guidance.kind === "ios-safari" && showIosHelp ? (
          <ol className="install-app__steps">
            <li>
              Tap <IosShareRounded fontSize="inherit" /> Share in Safari&apos;s
              toolbar
            </li>
            <li>Choose &ldquo;Add to Home Screen&rdquo;</li>
            <li>Tap Add</li>
          </ol>
        ) : null}

        {/* Every branch other than the real prompt has something true to say.
            This used to render nothing at all on a computer, which made the
            app look uninstallable there. */}
        {guidance.kind !== "prompt" && guidance.kind !== "ios-safari" ? (
          <Typography variant="body2" className="install-app__note">
            {GUIDANCE_COPY[guidance.kind]}
          </Typography>
        ) : null}
      </div>

      {/* A button only where one can do something. Where the browser owns the
          control, the note above is the whole instruction. */}
      {guidance.kind === "prompt" || guidance.kind === "ios-safari" ? (
        <div className="install-app__actions">
          {guidance.kind === "prompt" ? (
            <Button variant="contained" size="small" onClick={install}>
              {mobile ? "Add to home screen" : "Install app"}
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              onClick={() => setShowIosHelp((open) => !open)}
            >
              {showIosHelp ? "Hide steps" : "Show me how"}
            </Button>
          )}
        </div>
      ) : null}

      {requested ? null : (
        <IconButton
          className="install-app__close"
          size="small"
          aria-label="Dismiss install suggestion"
          onClick={dismiss}
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      )}
    </aside>
  );
}
