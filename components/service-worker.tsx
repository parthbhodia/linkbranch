"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for every page.
 *
 * Kept separate from the install panel: that only mounts on /card, which is
 * behind auth, so tying registration to it meant the offline shell and the
 * browser's install criteria only ever came into play for someone who had
 * already signed in and navigated there.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Nothing to recover: the app works online without it.
    });
  }, []);

  return null;
}
