"use client";

import { useSyncExternalStore } from "react";
import WalletRounded from "@mui/icons-material/WalletRounded";
import { Button } from "@mui/material";

/**
 * Downloads the profile as an Apple Wallet pass.
 *
 * Additive, like the voice note button: where Wallet does not exist the button
 * renders nothing and /card carries on being the way you show your code. The
 * pass is worth having because it beats this screen on the things a web page
 * cannot control -- it opens from the lock screen, Wallet forces the display to
 * maximum brightness for a barcode, and it syncs to Apple Watch on its own.
 *
 * There is no capability check for Wallet, so this reads the platform. Wallet
 * exists only on Apple hardware, and the case that matters is a phone held up
 * at an event, so the check is deliberately narrow: iPhone and iPad. A false
 * negative costs a Mac user a button they would rarely use; a false positive
 * hands an Android user a file their phone cannot open.
 */

function subscribeNever() {
  return () => {};
}

function isApplePocketDevice() {
  if (typeof navigator === "undefined") return false;
  if (/iPhone|iPod|iPad/.test(navigator.userAgent)) return true;
  // iPadOS 13+ reports itself as a Mac; touch points are what separate them.
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function AddToWalletButton({ username }: { username: string }) {
  // Unchanging external state with a different answer on the server -- same
  // reasoning as the voice note button. `false` server-side means the button
  // appears on hydration rather than flickering away.
  const supported = useSyncExternalStore(subscribeNever, isApplePocketDevice, () => false);

  if (!supported) return null;

  return (
    <Button
      component="a"
      href={`/api/wallet/${encodeURIComponent(username)}`}
      className="event-card__wallet"
      startIcon={<WalletRounded />}
      variant="outlined"
      size="small"
      // Not a same-page navigation: the response is a file, and letting the
      // router intercept it would leave the screen blank while Safari decides.
      data-no-router="true"
    >
      Add to Apple Wallet
    </Button>
  );
}
