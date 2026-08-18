"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import CloseRounded from "@mui/icons-material/CloseRounded";
import IosShareRounded from "@mui/icons-material/IosShareRounded";
import InstallMobileRounded from "@mui/icons-material/InstallMobileRounded";
import { Button, IconButton, Typography } from "@mui/material";

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

function isIos() {
  if (typeof window === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
    !/crios|fxios/i.test(window.navigator.userAgent)
  );
}

/**
 * Offers installation. The worker itself is registered app-wide by
 * ServiceWorkerRegistrar.
 *
 * Renders nothing when the app is already installed, when the visitor has
 * dismissed it before, or on a browser that can neither prompt nor be given
 * useful instructions -- so it is safe to mount anywhere.
 */
export function InstallApp() {
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

  const alreadyDismissed =
    isClient && window.localStorage.getItem(DISMISSED_KEY) === "1";

  // Safari implements no install API, so iOS is offered instructions rather
  // than a button that would do nothing when tapped.
  const iosCanInstall = isClient && isIos();

  const visible =
    isClient &&
    !installed &&
    !dismissed &&
    !alreadyDismissed &&
    !isStandalone() &&
    (Boolean(promptEvent) || iosCanInstall);

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
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
    <aside className="install-app">
      <div className="install-app__icon" aria-hidden="true">
        <InstallMobileRounded />
      </div>
      <div className="install-app__copy">
        <Typography component="h3">Keep your code in your pocket</Typography>
        <Typography variant="body2">
          Add Cueful to your home screen and your QR opens in one tap — no
          browser, no typing the address at an event.
        </Typography>

        {showIosHelp ? (
          <ol className="install-app__steps">
            <li>
              Tap <IosShareRounded fontSize="inherit" /> Share in Safari&apos;s
              toolbar
            </li>
            <li>Choose &ldquo;Add to Home Screen&rdquo;</li>
            <li>Tap Add</li>
          </ol>
        ) : null}
      </div>

      <div className="install-app__actions">
        {promptEvent ? (
          <Button variant="contained" size="small" onClick={install}>
            Add to home screen
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

      <IconButton
        className="install-app__close"
        size="small"
        aria-label="Dismiss install suggestion"
        onClick={dismiss}
      >
        <CloseRounded fontSize="small" />
      </IconButton>
    </aside>
  );
}
