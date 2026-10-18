"use client";

import { ButtonBase } from "@mui/material";

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
  return (
    <nav className="settings-jump" aria-label={`Jump to ${section}`}>
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
