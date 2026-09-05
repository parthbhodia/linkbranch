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

function isIosDevice() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPadOS 13+ reports itself as "Macintosh" and is indistinguishable from a
  // desktop Mac by user agent alone -- a touch-capable one is an iPad, since
  // no Mac reports more than one touch point.
  const iPadOs = /macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(ua) || iPadOs;
}

// Only Safari can add to the home screen on iOS. Chrome, Firefox and Edge
// there are all WebKit wrappers without the Share sheet's install item, so
// their users need sending to Safari rather than a set of steps they cannot
// follow.
function isIosSafari() {
  if (!isIosDevice()) return false;
  return !/crios|fxios|edgios|opios/i.test(window.navigator.userAgent);
}

function isAndroidDevice() {
  if (typeof window === "undefined") return false;
  return /android/i.test(window.navigator.userAgent);
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
};

/**
 * Offers installation. The worker itself is registered app-wide by
 * ServiceWorkerRegistrar.
 *
 * Renders nothing when the app is already installed, when the visitor has
 * dismissed it before, or on a browser that can neither prompt nor be given
 * useful instructions -- so it is safe to mount anywhere.
 */
export function InstallApp({
  placement = "inline",
  avoidBottom = false,
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

  const alreadyDismissed =
    isClient && window.localStorage.getItem(DISMISSED_KEY) === "1";

  // Safari implements no install API, so iOS is offered instructions rather
  // than a button that would do nothing when tapped.
  const iosSafari = isClient && isIosSafari();
  // A different message, not silence: these browsers cannot install at all,
  // and previously fell through to showing nothing.
  const iosOtherBrowser = isClient && isIosDevice() && !iosSafari;

  const mobile = isClient && (isIosDevice() || isAndroidDevice());

  const visible =
    isClient &&
    !installed &&
    !dismissed &&
    !alreadyDismissed &&
    !isStandalone() &&
    // The dashboard offer exists so the phone that gets carried to an event
    // can open the code without the browser. A desktop PWA does nothing for
    // that, so the floating placement stays off computers. The card screen
    // keeps offering it everywhere, which is what already shipped.
    (placement === "inline" || mobile) &&
    (Boolean(promptEvent) || iosSafari || iosOtherBrowser);

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

        {iosOtherBrowser ? (
          <Typography variant="body2" className="install-app__note">
            Only Safari can add an app to the iPhone home screen. Open this page
            in Safari and the option appears under Share.
          </Typography>
        ) : null}

        {showIosHelp && iosSafari ? (
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

      {/* No button for the browsers that cannot install: the note above is the
          whole instruction, and a button would imply an action that is not
          available to them. */}
      {iosOtherBrowser ? null : (
        <div className="install-app__actions">
          {promptEvent ? (
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
      )}

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
