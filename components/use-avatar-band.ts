"use client";

import { useEffect, type RefObject } from "react";

/**
 * Publishes `--avatar-band` on a container: the height of the photograph band at
 * the top of it.
 *
 * The band is a quarter of the screen, which is what it was asked for -- but a
 * quarter of the screen is a size, not a promise that anything fits inside it.
 * A two-line display name, a brand logo or a wide screen moves the name down far
 * enough that a fixed band ends above the name, leaving a strip of photograph
 * with nothing on it and the name on the plain card below. That is the reference
 * this is copying, inverted.
 *
 * So the band is the larger of a quarter of the screen and the point where the
 * name ends, plus room for the fade beneath it. It stays a quarter for a short
 * name, and gives way for a long one rather than cutting through it.
 */
export function useAvatarBand({
  enabled,
  containerRef,
  titleRef,
  floorPx,
  fadeRoom = 48,
}: {
  enabled: boolean;
  /** The element the band is drawn inside, and the one the property is set on. */
  containerRef: RefObject<HTMLElement | null>;
  /** The display name, which the band has to reach. */
  titleRef: RefObject<HTMLElement | null>;
  /** A quarter of whatever counts as the screen here -- viewport or phone. */
  floorPx: () => number;
  /** Space under the name for the band's bottom fade. */
  fadeRoom?: number;
}): void {
  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    const title = titleRef.current;
    if (!container || !title) return;

    const place = () => {
      const floor = floorPx();
      if (!floor) return;
      const top = container.getBoundingClientRect().top;
      const nameBottom = title.getBoundingClientRect().bottom - top;
      const needed = Math.ceil(nameBottom + fadeRoom);
      container.style.setProperty(
        "--avatar-band",
        `${Math.ceil(Math.max(floor, needed))}px`,
      );
    };

    place();
    window.addEventListener("resize", place);
    // Fonts land after first paint and can move the name by a line, which is
    // exactly the difference between the band reaching it and not.
    document.fonts.ready.then(place).catch(() => {});
    // The card grows as links change, and the phone as the window does.
    const observer = new ResizeObserver(place);
    observer.observe(container);

    return () => {
      window.removeEventListener("resize", place);
      observer.disconnect();
      container.style.removeProperty("--avatar-band");
    };
  }, [enabled, containerRef, titleRef, floorPx, fadeRoom]);
}
