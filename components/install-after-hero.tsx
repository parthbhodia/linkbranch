"use client";

import { useEffect, useState } from "react";
import { InstallApp } from "@/components/install-app";

/**
 * The install offer on the marketing page, held back until the visitor has
 * scrolled a full screen.
 *
 * On arrival the first viewport is the headline and the username field, and
 * that field is the only thing on the page worth doing. A card pinned to the
 * bottom lands directly on top of it -- measured at 390x844, where it covered
 * the input -- so the offer would be bought with the conversion it exists to
 * support.
 *
 * A viewport rather than a pixel count, because the thing being cleared is the
 * first screen and that is a different height on every phone. Latched: once
 * shown it stays, since a card that reappears and vanishes as you scroll reads
 * as a glitch.
 */
export function InstallAfterHero() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (scrolled) return;
    const check = () => {
      if (window.scrollY >= window.innerHeight) setScrolled(true);
    };
    // Someone arriving on a restored scroll position is already past it.
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [scrolled]);

  if (!scrolled) return null;

  return <InstallApp placement="floating" />;
}
