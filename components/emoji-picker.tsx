"use client";

import { useState } from "react";
import EmojiEmotionsRounded from "@mui/icons-material/EmojiEmotionsRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import { emojiCategories } from "@/lib/emojis";

/**
 * A phone-style emoji picker for people whose keyboard has no emoji key.
 *
 * It only reports the chosen glyph; where it lands in the text is the caller's
 * business, because a link title, a heading and a bio all insert differently.
 */
export function EmojiPickerButton({
  onInsert,
  label = "Insert emoji",
}: {
  onInsert: (emoji: string) => void;
  label?: string;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [tab, setTab] = useState(0);
  const open = Boolean(anchorEl);
  const active = emojiCategories[Math.min(tab, emojiCategories.length - 1)];

  return (
    <>
      <Tooltip title={label} arrow>
        <IconButton
          size="small"
          aria-label={label}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <EmojiEmotionsRounded fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { className: "emoji-picker" } }}
      >
        <Tabs
          value={tab}
          onChange={(_event, next) => setTab(next)}
          variant="scrollable"
          scrollButtons="auto"
          className="emoji-picker__tabs"
        >
          {emojiCategories.map((category, index) => (
            <Tab
              key={category.label}
              value={index}
              label={category.glyph}
              aria-label={category.label}
              title={category.label}
              className="emoji-picker__tab"
            />
          ))}
        </Tabs>
        <Box className="emoji-picker__grid" aria-label={active.label}>
          {active.emojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              className="emoji-picker__cell"
              aria-label={`Insert ${emoji}`}
              onClick={() => {
                onInsert(emoji);
                setAnchorEl(null);
              }}
            >
              {emoji}
            </button>
          ))}
        </Box>
      </Popover>
    </>
  );
}
