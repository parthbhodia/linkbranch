"use client";

import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import IconButton from "@mui/material/IconButton";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * A row of choices that scrolls sideways instead of wrapping.
 *
 * The options were a four-across grid, which quietly set a ceiling: a fifth
 * option became a second row and a ninth a third, so adding a choice meant
 * lengthening the panel. A rail holds any number in one row, shows the next
 * card peeking at the edge so it is obvious there is more, and snaps so the
 * cards never come to rest half-visible.
 *
 * The arrows exist for pointer and keyboard users alike: the rail is focusable
 * and scrolls with the arrow keys natively, and these are the same movement in
 * a bigger step.
 */
export function ChoiceCarousel({
  label,
  children,
}: {
  /** Announced name for the rail, e.g. "Type pairing". */
  label: string;
  children: ReactNode;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const atStart = rail.scrollLeft <= 2;
    const atEnd = max <= 2 || rail.scrollLeft >= max - 2;
    setEdges((current) =>
      current.atStart === atStart && current.atEnd === atEnd
        ? current
        : { atStart, atEnd },
    );
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    sync();
    // The panel is hidden until its tab is open, so the rail is measured at
    // zero width on mount and again when it becomes visible.
    const observer = new ResizeObserver(sync);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [sync]);

  const step = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    // One card plus the gap, read from the rail rather than assumed, so the
    // step stays right if the cards are resized.
    const first = rail.firstElementChild as HTMLElement | null;
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
    const distance = first ? first.offsetWidth + gap : rail.clientWidth;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({
      left: direction * distance,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <div className="workspace-carousel">
      <div
        className="workspace-carousel__rail"
        ref={railRef}
        role="group"
        aria-label={label}
        tabIndex={0}
        onScroll={sync}
      >
        {children}
      </div>
      <div className="workspace-carousel__controls">
        <IconButton
          size="small"
          onClick={() => step(-1)}
          disabled={edges.atStart}
          aria-label={`Show earlier ${label} options`}
        >
          <ChevronLeftRounded fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => step(1)}
          disabled={edges.atEnd}
          aria-label={`Show more ${label} options`}
        >
          <ChevronRightRounded fontSize="small" />
        </IconButton>
      </div>
    </div>
  );
}
