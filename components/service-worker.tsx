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

    // Development never registers.
    //
    // The worker caches /_next/static/ cache-first and keeps it forever, which
    // is correct in production because those filenames carry a content hash --
    // change the file and you get a new name. Development does not work that
    // way: app_globals_<hash>.css keeps its name while its contents change on
    // every save, so the first stylesheet a load ever saw is pinned in place
    // and every later change is invisible. It looks exactly like a broken
    // page, and no amount of reloading clears it.
    //
    // So dev takes out whatever a previous load installed, along with what it
    // cached, and leaves registration to production.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations.map((registration) => registration.unregister()),
          ),
        )
        .catch(() => undefined);

      if ("caches" in window) {
        void caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith("cueful-"))
                .map((key) => caches.delete(key)),
            ),
          )
          .catch(() => undefined);
      }

      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Nothing to recover: the app works online without it.
    });
  }, []);

  return null;
}
