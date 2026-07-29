"use client";

import { ButtonBase } from "@mui/material";

export const settingsJumpTargets = [
  { id: "settings-profile", label: "Profile" },
  { id: "settings-seo", label: "SEO" },
  { id: "settings-qr", label: "QR" },
  { id: "settings-connect", label: "Connect" },
  { id: "settings-tools", label: "Tools" },
] as const;

export type SettingsJumpId = (typeof settingsJumpTargets)[number]["id"];

export function SettingsJumpNav({
  activeId,
  onJump,
}: {
  activeId?: string | null;
  onJump: (id: SettingsJumpId) => void;
}) {
  return (
    <nav className="settings-jump" aria-label="Jump to settings section">
      <span className="settings-jump__label">Jump to</span>
      <div className="settings-jump__list">
        {settingsJumpTargets.map((item) => (
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
