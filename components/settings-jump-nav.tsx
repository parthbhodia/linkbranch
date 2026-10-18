"use client";

import { useEffect, useRef } from "react";
import { ButtonBase } from "@mui/material";

/**
 * How much of the panel is hidden above the sticky bar once it has stuck.
 *
 * This is the number that is easy to get wrong twice over, so it is measured
 * rather than assumed. A sticky element's `top` is measured from its scroll
 * container's padding edge, not from the top of what the reader can actually
 * see. The dashboard's editor column has its own top padding, so `top: 0` puts
 * the bar one padding below the top edge of the column, with that strip left
 * uncovered for groups to scroll through on their way past. On a phone the bar
 * is pushed further down again, to clear the mobile header, and the strip grows
 * with it. Both the padding and the sticky offset change with the breakpoint,
 * so neither can be hardcoded.
 *
 * Published on the bar as --jump-cover, where the CSS uses it to close the strip
 * and jumpToGroup uses it to land groups below the bar.
 */
function measureCover(bar: HTMLElement) {
  let scroller = bar.parentElement;
  while (scroller) {
    const overflowY = getComputedStyle(scroller).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") break;
    scroller = scroller.parentElement;
  }
  const paddingTop = scroller
    ? parseFloat(getComputedStyle(scroller).paddingTop) || 0
    : 0;
  const stickyTop = parseFloat(getComputedStyle(bar).top) || 0;
  const cover = paddingTop + stickyTop;
  bar.style.setProperty("--jump-cover", `${cover}px`);
  return cover;
}

/**
 * Scrolls a panel group into view, clear of the sticky jump bar above it.
 *
 * Two things this has to get right, both of them learned the hard way:
 *
 * A plain scrollIntoView puts the group against the top of the scrollport,
 * which with a sticky bar means the group's own heading lands *behind* the bar
 * -- jump to "Your photo" and you get the photo controls with nothing saying
 * you are looking at them.
 *
 * And it has to reach the group by walking up to its scroll parent, not by
 * scrolling the window: the dashboard does not scroll the window at all. It is
 * a 100svh shell with overflow hidden, and the editor scrolls its own column,
 * so a window.scrollTo here silently does nothing.
 */
export function jumpToGroup(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const bar = document.querySelector<HTMLElement>(".settings-jump");
  // The strip above the bar, the bar itself, then 16px of air matching the gap
  // the groups sit in.
  const cover = bar
    ? parseFloat(getComputedStyle(bar).getPropertyValue("--jump-cover")) || 0
    : 0;
  const offset = cover + (bar?.offsetHeight ?? 0) + 16;
  target.style.scrollMarginTop = `${offset}px`;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * The row of pills that jumps to a section further down the panel.
 *
 * Both long settings panels need one, and they started as two separate copies
 * of this until the appearance panel grew past a dozen groups and the avatar
 * controls became unfindable again.
 *
 * Generic in the id type, so each panel's handler is handed exactly the ids
 * that panel declared and nothing else.
 */
function JumpNav<T extends string>({
  targets,
  activeId,
  onJump,
  section,
}: {
  targets: readonly { id: T; label: string }[];
  activeId?: T | null;
  onJump: (id: T) => void;
  /** What is being jumped to, read out rather than shown. */
  section: string;
}) {
  const barRef = useRef<HTMLElement | null>(null);

  // Re-measured on resize because the scroller's padding and the sticky offset
  // both change with the breakpoint, and a pill row that wraps to fewer rows on
  // a wider window is a shorter bar to jump past.
  useEffect(() => {
    const node = barRef.current;
    if (!node) return;
    const measure = () => measureCover(node);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <nav
      ref={barRef}
      className="settings-jump"
      aria-label={`Jump to ${section}`}
    >
      <span className="settings-jump__label">Jump to</span>
      <div className="settings-jump__list">
        {targets.map((item) => (
          <ButtonBase
            key={item.id}
            className={activeId === item.id ? "is-active" : undefined}
            onClick={() => onJump(item.id)}
          >
            {item.label}
          </ButtonBase>
        ))}
      </div>
    </nav>
  );
}

export const settingsJumpTargets = [
  { id: "settings-profile", label: "Profile" },
  { id: "settings-card", label: "Contact card" },
  { id: "settings-seo", label: "SEO" },
  { id: "settings-qr", label: "QR" },
  { id: "settings-tools", label: "Tools" },
] as const;

export type SettingsJumpId = (typeof settingsJumpTargets)[number]["id"];

export function SettingsJumpNav({
  activeId,
  onJump,
}: {
  activeId?: SettingsJumpId | null;
  onJump: (id: SettingsJumpId) => void;
}) {
  return (
    <JumpNav
      targets={settingsJumpTargets}
      activeId={activeId}
      onJump={onJump}
      section="settings section"
    />
  );
}

/**
 * Appearance is one long scroll of a dozen groups. These are the ones worth
 * landing on directly; the rest sit between them, close enough to reach by
 * scrolling. "Your photo" is in here on purpose: it holds the shape, frame and
 * faded-backdrop controls, which is exactly the set that kept going missing.
 */
export const appearanceJumpTargets = [
  { id: "appearance-layout", label: "Layout" },
  { id: "appearance-photo", label: "Your photo" },
  { id: "appearance-colour", label: "Colour" },
  { id: "appearance-type", label: "Type" },
  { id: "appearance-buttons", label: "Buttons" },
  { id: "appearance-social", label: "Social icons" },
  { id: "appearance-wallpapers", label: "Wallpapers" },
  { id: "appearance-branding", label: "Branding" },
] as const;

export type AppearanceJumpId = (typeof appearanceJumpTargets)[number]["id"];

export function AppearanceJumpNav({
  activeId,
  onJump,
}: {
  activeId?: AppearanceJumpId | null;
  onJump: (id: AppearanceJumpId) => void;
}) {
  return (
    <JumpNav
      targets={appearanceJumpTargets}
      activeId={activeId}
      onJump={onJump}
      section="appearance section"
    />
  );
}
